-- =====================================================
-- DESABILITAR RLS PARA VENDAS DETALHADAS
-- =====================================================

-- Desabilitar RLS para desenvolvimento sem autenticação
ALTER TABLE vendas_detalhadas DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'vendas_detalhadas';

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'vendas_detalhadas';

-- Testar acesso sem autenticação
SELECT COUNT(*) as total_registros FROM vendas_detalhadas;

-- Mostrar estrutura final
SELECT 
    'vendas_detalhadas' as tabela,
    'RLS Desabilitado' as status,
    COUNT(*) as registros_existentes
FROM vendas_detalhadas;