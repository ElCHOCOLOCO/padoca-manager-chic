-- =====================================================
-- VERIFICAR INTEGRAÇÃO MARX VENDAS
-- =====================================================

-- 1. VERIFICAR TABELAS EXISTENTES
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('institutos_vendas', 'projecoes_vendas', 'vendas_detalhadas')
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
    'institutos_vendas' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'institutos_vendas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'projecoes_vendas' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projecoes_vendas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'vendas_detalhadas' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas_detalhadas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR DADOS NAS TABELAS
SELECT 
    'institutos_vendas' as tabela,
    COUNT(*) as total_registros
FROM institutos_vendas
UNION ALL
SELECT 
    'projecoes_vendas' as tabela,
    COUNT(*) as total_registros
FROM projecoes_vendas
UNION ALL
SELECT 
    'vendas_detalhadas' as tabela,
    COUNT(*) as total_registros
FROM vendas_detalhadas;

-- 4. VERIFICAR INSTITUTOS INSERIDOS
SELECT 
    codigo,
    nome,
    turno,
    created_at
FROM institutos_vendas
ORDER BY codigo;

-- 5. VERIFICAR RLS STATUS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('institutos_vendas', 'projecoes_vendas', 'vendas_detalhadas')
AND schemaname = 'public';

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('institutos_vendas', 'projecoes_vendas', 'vendas_detalhadas')
AND schemaname = 'public';

-- 7. VERIFICAR TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('institutos_vendas', 'projecoes_vendas', 'vendas_detalhadas');

-- 8. VERIFICAR ÍNDICES
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('institutos_vendas', 'projecoes_vendas', 'vendas_detalhadas')
AND schemaname = 'public';

-- 9. VERIFICAR VIEWS
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'resumo_vendas_diarias';

-- 10. TESTAR VIEW
SELECT * FROM resumo_vendas_diarias LIMIT 5;

-- 11. TESTAR INSERÇÃO DE DADOS (SIMULAÇÃO)
-- Inserir alguns dados de teste para verificar se tudo funciona
INSERT INTO projecoes_vendas (instituto_id, data_referencia, dia_semana, projecao, vendas_reais)
SELECT 
    iv.id,
    CURRENT_DATE,
    'segunda',
    50,
    45
FROM institutos_vendas iv
WHERE iv.codigo = 'IAD M'
ON CONFLICT (instituto_id, data_referencia) DO NOTHING;

-- 12. VERIFICAR DADOS INSERIDOS
SELECT 
    pv.data_referencia,
    pv.dia_semana,
    pv.projecao,
    pv.vendas_reais,
    iv.codigo,
    iv.nome
FROM projecoes_vendas pv
JOIN institutos_vendas iv ON pv.instituto_id = iv.id
WHERE pv.data_referencia = CURRENT_DATE
ORDER BY iv.codigo;

-- 13. RESUMO FINAL
SELECT 
    '✅ Integração Marx Vendas' as status,
    'Tabelas criadas e configuradas' as info,
    'Pronto para receber dados' as observacao;