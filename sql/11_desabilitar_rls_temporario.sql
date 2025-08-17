-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE (APENAS PARA TESTES)
-- =====================================================
-- ⚠️ ATENÇÃO: Este script desabilita as políticas de segurança
-- Use apenas para testes e reabilite depois!

-- 1. Desabilitar RLS nas tabelas
ALTER TABLE institutos_vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_vendas DISABLE ROW LEVEL SECURITY;

-- 2. Verificar status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('institutos_vendas', 'projecoes_vendas')
AND schemaname = 'public';

-- 3. Testar acesso sem autenticação
SELECT 
    'Teste de acesso sem autenticação' as info,
    COUNT(*) as total_institutos
FROM institutos_vendas;

-- =====================================================
-- PARA REABILITAR RLS DEPOIS DOS TESTES:
-- =====================================================
/*
ALTER TABLE institutos_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_vendas ENABLE ROW LEVEL SECURITY;
*/