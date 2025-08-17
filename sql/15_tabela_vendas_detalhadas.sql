-- =====================================================
-- TABELA DE VENDAS DETALHADAS
-- =====================================================

-- 1. TABELA DE VENDAS DETALHADAS
CREATE TABLE IF NOT EXISTS vendas_detalhadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    paes INTEGER NOT NULL DEFAULT 0 CHECK (paes >= 0),
    salgados INTEGER NOT NULL DEFAULT 0 CHECK (salgados >= 0),
    chocolates INTEGER NOT NULL DEFAULT 0 CHECK (chocolates >= 0),
    refrigerantes INTEGER NOT NULL DEFAULT 0 CHECK (refrigerantes >= 0),
    lucro_dia DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (lucro_dia >= 0),
    total_vendas DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_vendas >= 0),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABILITAR RLS
ALTER TABLE vendas_detalhadas ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS RLS (VERIFICANDO SE JÁ EXISTEM)
DO $$
BEGIN
    -- Política para vendas_detalhadas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vendas_detalhadas' 
        AND policyname = 'Usuários autenticados podem gerenciar vendas_detalhadas'
    ) THEN
        CREATE POLICY "Usuários autenticados podem gerenciar vendas_detalhadas" ON vendas_detalhadas
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política para vendas_detalhadas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Política para vendas_detalhadas já existe!';
    END IF;
END $$;

-- 4. CRIAR TRIGGER (VERIFICANDO SE JÁ EXISTE)
DO $$
BEGIN
    -- Trigger para vendas_detalhadas
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_vendas_detalhadas_updated_at'
    ) THEN
        CREATE TRIGGER update_vendas_detalhadas_updated_at
            BEFORE UPDATE ON vendas_detalhadas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger para vendas_detalhadas criado com sucesso!';
    ELSE
        RAISE NOTICE 'Trigger para vendas_detalhadas já existe!';
    END IF;
END $$;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_vendas_detalhadas_data ON vendas_detalhadas(data);
CREATE INDEX IF NOT EXISTS idx_vendas_detalhadas_lucro ON vendas_detalhadas(lucro_dia);
CREATE INDEX IF NOT EXISTS idx_vendas_detalhadas_created_at ON vendas_detalhadas(created_at);

-- 6. CRIAR VIEW PARA RESUMO DE VENDAS
CREATE OR REPLACE VIEW resumo_vendas_diarias AS
SELECT 
    data,
    SUM(paes) as total_paes,
    SUM(salgados) as total_salgados,
    SUM(chocolates) as total_chocolates,
    SUM(refrigerantes) as total_refrigerantes,
    SUM(lucro_dia) as total_lucro,
    SUM(total_vendas) as total_vendas,
    COUNT(*) as registros,
    SUM(paes + salgados + chocolates + refrigerantes) as total_itens,
    CASE 
        WHEN SUM(paes + salgados + chocolates + refrigerantes) > 0 
        THEN SUM(total_vendas) / SUM(paes + salgados + chocolates + refrigerantes)
        ELSE 0 
    END as media_por_item
FROM vendas_detalhadas
GROUP BY data
ORDER BY data DESC;

-- 7. VERIFICAR RESULTADO
SELECT 
    'vendas_detalhadas' as tabela,
    COUNT(*) as total_registros
FROM vendas_detalhadas;

-- 8. MOSTRAR ESTRUTURA DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendas_detalhadas' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. TESTAR VIEW
SELECT * FROM resumo_vendas_diarias LIMIT 5;