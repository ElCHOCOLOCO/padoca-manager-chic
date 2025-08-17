-- =====================================================
-- VERIFICAR SE AS TABELAS EXISTEM
-- =====================================================

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('institutos_vendas', 'projecoes_vendas') THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('institutos_vendas', 'projecoes_vendas')
ORDER BY table_name;

-- 2. Se não existirem, mostrar todas as tabelas disponíveis
SELECT 
    'TABELAS DISPONÍVEIS:' as info,
    table_name,
    'Tabela do sistema' as descricao
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT LIKE 'pg_%'
AND table_name NOT LIKE 'sql_%'
ORDER BY table_name;

-- 3. Verificar se os enums existem
SELECT 
    typname as enum_name,
    CASE 
        WHEN typname IN ('turno_enum', 'dia_semana_enum') THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM pg_type 
WHERE typname IN ('turno_enum', 'dia_semana_enum');

-- 4. Verificar se a função update_updated_at_column existe
SELECT 
    routine_name,
    CASE 
        WHEN routine_name = 'update_updated_at_column' THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';