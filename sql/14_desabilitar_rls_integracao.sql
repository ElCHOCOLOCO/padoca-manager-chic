-- =====================================================
-- DESABILITAR RLS PARA TABELA DE INTEGRAÇÃO
-- =====================================================
-- ⚠️ ATENÇÃO: Este script desabilita as políticas de segurança
-- Use apenas para desenvolvimento local

-- 1. Desabilitar RLS na tabela de integração
ALTER TABLE integracao_vendas DISABLE ROW LEVEL SECURITY;

-- 2. Verificar status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'integracao_vendas'
AND schemaname = 'public';

-- 3. Testar acesso sem autenticação
SELECT 
    'Teste de acesso sem autenticação' as info,
    COUNT(*) as total_registros
FROM integracao_vendas;

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'integracao_vendas' 
AND table_schema = 'public'
ORDER BY ordinal_position;