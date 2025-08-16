-- =====================================================
-- VIEWS OTIMIZADAS PARA ANÁLISES
-- =====================================================

-- View para Estatísticas de Escala
CREATE OR REPLACE VIEW escala_estatisticas AS
SELECT 
    -- Estatísticas gerais
    COUNT(DISTINCT c.id) as total_camaradas,
    COUNT(DISTINCT i.id) as total_institutos,
    COUNT(e.id) as total_atribuicoes,
    ROUND(COUNT(e.id)::numeric / NULLIF(COUNT(DISTINCT c.id), 0), 2) as media_por_camarada,
    
    -- Distribuição por turno
    COUNT(CASE WHEN e.turno = 'manha' THEN 1 END) as manha_count,
    COUNT(CASE WHEN e.turno = 'tarde' THEN 1 END) as tarde_count,
    COUNT(CASE WHEN e.turno = 'noite' THEN 1 END) as noite_count,
    
    -- Distribuição por dia
    COUNT(CASE WHEN e.dia = 'seg' THEN 1 END) as seg_count,
    COUNT(CASE WHEN e.dia = 'ter' THEN 1 END) as ter_count,
    COUNT(CASE WHEN e.dia = 'qua' THEN 1 END) as qua_count,
    COUNT(CASE WHEN e.dia = 'qui' THEN 1 END) as qui_count,
    COUNT(CASE WHEN e.dia = 'sex' THEN 1 END) as sex_count
FROM camaradas c
CROSS JOIN institutos i
LEFT JOIN escala e ON e.camarada_id = c.id AND e.instituto_id = i.id;

-- View para Ranking de Camaradas
CREATE OR REPLACE VIEW ranking_camaradas AS
SELECT 
    c.id,
    c.nome,
    c.curso,
    COUNT(e.id) as total_escalas,
    COUNT(DISTINCT e.instituto_id) as institutos_diferentes,
    ROUND(
        (COUNT(e.id)::numeric / NULLIF((SELECT COUNT(*) FROM escala), 0)) * 100, 
        2
    ) as percentual_total,
    STRING_AGG(DISTINCT i.nome, ', ' ORDER BY i.nome) as institutos_atribuidos,
    STRING_AGG(DISTINCT e.turno::text, ', ' ORDER BY e.turno) as turnos_atribuidos
FROM camaradas c
LEFT JOIN escala e ON e.camarada_id = c.id
LEFT JOIN institutos i ON e.instituto_id = i.id
GROUP BY c.id, c.nome, c.curso
ORDER BY total_escalas DESC, c.nome;

-- View para Análise de Carga por Instituto
CREATE OR REPLACE VIEW carga_institutos AS
SELECT 
    i.id,
    i.nome,
    i.tipo,
    COUNT(e.id) as total_atribuicoes,
    COUNT(DISTINCT e.camarada_id) as camaradas_diferentes,
    COUNT(DISTINCT e.dia) as dias_cobertos,
    STRING_AGG(DISTINCT e.turno::text, ', ' ORDER BY e.turno) as turnos_cobertos,
    ROUND(
        (COUNT(e.id)::numeric / NULLIF((SELECT COUNT(*) FROM escala), 0)) * 100, 
        2
    ) as percentual_total
FROM institutos i
LEFT JOIN escala e ON e.instituto_id = i.id
GROUP BY i.id, i.nome, i.tipo
ORDER BY total_atribuicoes DESC, i.nome;

-- View para Escala Compacta (Otimizada para 30 camaradas)
CREATE OR REPLACE VIEW escala_compacta AS
WITH escala_detalhada AS (
    SELECT 
        c.id as camarada_id,
        c.nome as camarada_nome,
        i.id as instituto_id,
        i.nome as instituto_nome,
        e.dia,
        e.turno,
        e.id as escala_id
    FROM camaradas c
    CROSS JOIN (VALUES ('seg'), ('ter'), ('qua'), ('qui'), ('sex')) AS dias(dia)
    CROSS JOIN (VALUES ('manha'), ('tarde'), ('noite')) AS turnos(turno)
    LEFT JOIN escala e ON e.camarada_id = c.id AND e.dia = dias.dia AND e.turno = turnos.turno
    LEFT JOIN institutos i ON e.instituto_id = i.id
)
SELECT 
    camarada_id,
    camarada_nome,
    dia,
    turno,
    instituto_id,
    instituto_nome,
    escala_id,
    CASE 
        WHEN instituto_id IS NOT NULL THEN instituto_nome
        ELSE NULL 
    END as atribuicao
FROM escala_detalhada
ORDER BY camarada_nome, dia, turno;

-- View para Cálculo de Custos de Produtos
CREATE OR REPLACE VIEW custos_produtos AS
SELECT 
    r.id as recipe_id,
    r.name as produto_nome,
    r.units_per_batch as unidades_lote,
    r.created_at,
    r.user_id,
    
    -- Cálculo do custo total do lote
    COALESCE(SUM(
        CASE 
            WHEN ri.quantity IS NOT NULL THEN ri.cost * ri.quantity
            ELSE ri.cost
        END
    ), 0) as custo_total_lote,
    
    -- Cálculo do custo por unidade
    CASE 
        WHEN r.units_per_batch > 0 THEN 
            COALESCE(SUM(
                CASE 
                    WHEN ri.quantity IS NOT NULL THEN ri.cost * ri.quantity
                    ELSE ri.cost
                END
            ), 0) / r.units_per_batch
        ELSE 0 
    END as custo_por_unidade,
    
    -- Contagem de ingredientes
    COUNT(ri.id) as total_ingredientes,
    
    -- Lista de ingredientes
    STRING_AGG(
        ri.name || ' (' || 
        COALESCE(ri.quantity::text, '1') || ' ' || 
        COALESCE(ri.unit, 'kg') || ' - ' || 
        ri.cost::text || ' R$)', 
        ', ' ORDER BY ri.idx
    ) as ingredientes
FROM insumo_recipes r
LEFT JOIN insumo_recipe_items ri ON ri.recipe_id = r.id
GROUP BY r.id, r.name, r.units_per_batch, r.created_at, r.user_id
ORDER BY r.created_at DESC;

-- Verificar views criadas
SELECT 'Views criadas com sucesso!' as status;