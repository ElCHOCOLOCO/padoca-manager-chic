-- =====================================================
-- DESABILITAR RLS PARA TABELA DE VENDAS DETALHADAS
-- =====================================================
-- ⚠️ ATENÇÃO: Este script desabilita as políticas de segurança
-- Use apenas para desenvolvimento local

-- 1. Desabilitar RLS na tabela de vendas detalhadas
ALTER TABLE vendas_detalhadas DISABLE ROW LEVEL SECURITY;

-- 2. Verificar status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'vendas_detalhadas'
AND schemaname = 'public';

-- 3. Testar acesso sem autenticação
SELECT 
    'Teste de acesso sem autenticação' as info,
    COUNT(*) as total_registros
FROM vendas_detalhadas;

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'vendas_detalhadas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Testar view de resumo
SELECT * FROM resumo_vendas_diarias LIMIT 3;