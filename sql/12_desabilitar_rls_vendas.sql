-- =====================================================
-- DESABILITAR RLS PARA TABELAS DE VENDAS
-- =====================================================
-- ⚠️ ATENÇÃO: Este script desabilita as políticas de segurança
-- Use apenas para desenvolvimento local

-- 1. Desabilitar RLS nas tabelas de vendas
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

-- 4. Verificar se há dados
SELECT 
    'Dados de institutos_vendas' as tabela,
    COUNT(*) as total_registros
FROM institutos_vendas
UNION ALL
SELECT 
    'Dados de projecoes_vendas' as tabela,
    COUNT(*) as total_registros
FROM projecoes_vendas;

-- 5. Mostrar alguns institutos
SELECT codigo, nome, turno FROM institutos_vendas ORDER BY codigo LIMIT 5;