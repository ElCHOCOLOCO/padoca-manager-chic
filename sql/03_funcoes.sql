-- =====================================================
-- FUNÇÕES DE CÁLCULO E ANÁLISE
-- =====================================================

-- Função para Calcular Custo de Produto
CREATE OR REPLACE FUNCTION calcular_custo_produto(recipe_uuid UUID)
RETURNS TABLE(
    custo_total_lote DECIMAL(10,2),
    custo_por_unidade DECIMAL(10,2),
    total_ingredientes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN ri.quantity IS NOT NULL THEN ri.cost * ri.quantity
                ELSE ri.cost
            END
        ), 0) as custo_total_lote,
        
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
        
        COUNT(ri.id) as total_ingredientes
    FROM insumo_recipes r
    LEFT JOIN insumo_recipe_items ri ON ri.recipe_id = r.id
    WHERE r.id = recipe_uuid
    GROUP BY r.units_per_batch;
END;
$$ LANGUAGE plpgsql;

-- Função para Estatísticas de Escala
CREATE OR REPLACE FUNCTION estatisticas_escala()
RETURNS TABLE(
    total_camaradas BIGINT,
    total_institutos BIGINT,
    total_atribuicoes BIGINT,
    media_por_camarada DECIMAL(5,2),
    camaradas_mais_ativos JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(DISTINCT c.id) as total_cam,
            COUNT(DISTINCT i.id) as total_inst,
            COUNT(e.id) as total_attr,
            ROUND(COUNT(e.id)::numeric / NULLIF(COUNT(DISTINCT c.id), 0), 2) as media
        FROM camaradas c
        CROSS JOIN institutos i
        LEFT JOIN escala e ON e.camarada_id = c.id AND e.instituto_id = i.id
    ),
    top_camaradas AS (
        SELECT 
            json_agg(
                json_build_object(
                    'id', c.id,
                    'nome', c.nome,
                    'curso', c.curso,
                    'total_escalas', COUNT(e.id),
                    'percentual', ROUND((COUNT(e.id)::numeric / NULLIF((SELECT COUNT(*) FROM escala), 0)) * 100, 2)
                ) ORDER BY COUNT(e.id) DESC
            ) as top_10
        FROM camaradas c
        LEFT JOIN escala e ON e.camarada_id = c.id
        GROUP BY c.id, c.nome, c.curso
        ORDER BY COUNT(e.id) DESC
        LIMIT 10
    )
    SELECT 
        s.total_cam,
        s.total_inst,
        s.total_attr,
        s.media,
        t.top_10
    FROM stats s
    CROSS JOIN top_camaradas t;
END;
$$ LANGUAGE plpgsql;

-- Função para Busca de Camaradas
CREATE OR REPLACE FUNCTION buscar_camaradas(
    termo_busca TEXT DEFAULT NULL,
    curso_filtro TEXT DEFAULT NULL,
    turno_filtro turno_enum DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    curso TEXT,
    turnos turno_enum[],
    total_escalas BIGINT,
    institutos_atribuidos TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        c.curso,
        c.turnos,
        COUNT(e.id) as total_escalas,
        ARRAY_AGG(DISTINCT i.nome) FILTER (WHERE i.nome IS NOT NULL) as institutos
    FROM camaradas c
    LEFT JOIN escala e ON e.camarada_id = c.id
    LEFT JOIN institutos i ON e.instituto_id = i.id
    WHERE 
        (termo_busca IS NULL OR c.nome ILIKE '%' || termo_busca || '%')
        AND (curso_filtro IS NULL OR c.curso = curso_filtro)
        AND (turno_filtro IS NULL OR turno_filtro = ANY(c.turnos))
    GROUP BY c.id, c.nome, c.curso, c.turnos
    ORDER BY c.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para Análise de Carga de Trabalho
CREATE OR REPLACE FUNCTION analise_carga_trabalho(limite INTEGER DEFAULT 30)
RETURNS TABLE(
    nome TEXT,
    curso TEXT,
    total_escalas BIGINT,
    institutos_diferentes BIGINT,
    dias_trabalhados BIGINT,
    turnos_atribuidos TEXT,
    percentual_carga DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.nome,
        c.curso,
        COUNT(e.id) as total_escalas,
        COUNT(DISTINCT e.instituto_id) as institutos_diferentes,
        COUNT(DISTINCT e.dia) as dias_trabalhados,
        STRING_AGG(DISTINCT e.turno::text, ', ' ORDER BY e.turno) as turnos_atribuidos,
        ROUND(
            (COUNT(e.id)::numeric / NULLIF((SELECT COUNT(*) FROM escala), 0)) * 100, 
            2
        ) as percentual_carga
    FROM camaradas c
    LEFT JOIN escala e ON e.camarada_id = c.id
    GROUP BY c.id, c.nome, c.curso
    ORDER BY total_escalas DESC, c.nome
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Função para Análise de Cobertura por Instituto
CREATE OR REPLACE FUNCTION analise_cobertura_institutos()
RETURNS TABLE(
    nome TEXT,
    tipo TEXT,
    total_atribuicoes BIGINT,
    camaradas_diferentes BIGINT,
    dias_cobertos BIGINT,
    turnos_cobertos TEXT,
    status_cobertura TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.nome,
        i.tipo,
        COUNT(e.id) as total_atribuicoes,
        COUNT(DISTINCT e.camarada_id) as camaradas_diferentes,
        COUNT(DISTINCT e.dia) as dias_cobertos,
        STRING_AGG(DISTINCT e.turno::text, ', ' ORDER BY e.turno) as turnos_cobertos,
        CASE 
            WHEN COUNT(DISTINCT e.dia) = 5 AND COUNT(DISTINCT e.turno) = 3 THEN 'Cobertura Completa'
            WHEN COUNT(DISTINCT e.dia) >= 3 THEN 'Cobertura Parcial'
            ELSE 'Cobertura Baixa'
        END as status_cobertura
    FROM institutos i
    LEFT JOIN escala e ON e.instituto_id = i.id
    GROUP BY i.id, i.nome, i.tipo
    ORDER BY total_atribuicoes DESC, i.nome;
END;
$$ LANGUAGE plpgsql;

-- Função para Dashboard Principal
CREATE OR REPLACE FUNCTION dashboard_principal()
RETURNS TABLE(
    total_camaradas BIGINT,
    total_institutos BIGINT,
    total_cas BIGINT,
    total_atribuicoes BIGINT,
    total_produtos BIGINT,
    cas_aliados BIGINT,
    cas_neutros BIGINT,
    cas_inimigos BIGINT,
    humor_positivo BIGINT,
    humor_neutro BIGINT,
    humor_negativo BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM camaradas) as total_camaradas,
        (SELECT COUNT(*) FROM institutos) as total_institutos,
        (SELECT COUNT(*) FROM cas) as total_cas,
        (SELECT COUNT(*) FROM escala) as total_atribuicoes,
        (SELECT COUNT(*) FROM insumo_recipes) as total_produtos,
        (SELECT COUNT(*) FROM cas WHERE status = 'aliado') as cas_aliados,
        (SELECT COUNT(*) FROM cas WHERE status = 'neutro') as cas_neutros,
        (SELECT COUNT(*) FROM cas WHERE status = 'inimigo') as cas_inimigos,
        (SELECT COUNT(*) FROM cas WHERE humor = 'positivo') as humor_positivo,
        (SELECT COUNT(*) FROM cas WHERE humor = 'neutro') as humor_neutro,
        (SELECT COUNT(*) FROM cas WHERE humor = 'negativo') as humor_negativo;
END;
$$ LANGUAGE plpgsql;

-- Verificar funções criadas
SELECT 'Funções criadas com sucesso!' as status;