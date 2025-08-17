-- =====================================================
-- TABELA DE INTEGRAÇÃO DE VENDAS
-- =====================================================

-- 1. ENUM para fonte de dados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fonte_integracao_enum') THEN
        CREATE TYPE fonte_integracao_enum AS ENUM ('pdv_central', 'marx_vendas');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_integracao_enum') THEN
        CREATE TYPE status_integracao_enum AS ENUM ('pendente', 'processado', 'erro');
    END IF;
END $$;

-- 2. TABELA DE INTEGRAÇÃO DE VENDAS
CREATE TABLE IF NOT EXISTS integracao_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    vendas_total INTEGER NOT NULL CHECK (vendas_total >= 0),
    fonte fonte_integracao_enum NOT NULL,
    status status_integracao_enum NOT NULL DEFAULT 'pendente',
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data, fonte)
);

-- 3. HABILITAR RLS
ALTER TABLE integracao_vendas ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLÍTICAS RLS (VERIFICANDO SE JÁ EXISTEM)
DO $$
BEGIN
    -- Política para integracao_vendas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'integracao_vendas' 
        AND policyname = 'Usuários autenticados podem gerenciar integracao_vendas'
    ) THEN
        CREATE POLICY "Usuários autenticados podem gerenciar integracao_vendas" ON integracao_vendas
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política para integracao_vendas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Política para integracao_vendas já existe!';
    END IF;
END $$;

-- 5. CRIAR TRIGGER (VERIFICANDO SE JÁ EXISTE)
DO $$
BEGIN
    -- Trigger para integracao_vendas
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_integracao_vendas_updated_at'
    ) THEN
        CREATE TRIGGER update_integracao_vendas_updated_at
            BEFORE UPDATE ON integracao_vendas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger para integracao_vendas criado com sucesso!';
    ELSE
        RAISE NOTICE 'Trigger para integracao_vendas já existe!';
    END IF;
END $$;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_integracao_vendas_data ON integracao_vendas(data);
CREATE INDEX IF NOT EXISTS idx_integracao_vendas_fonte ON integracao_vendas(fonte);
CREATE INDEX IF NOT EXISTS idx_integracao_vendas_status ON integracao_vendas(status);
CREATE INDEX IF NOT EXISTS idx_integracao_vendas_data_fonte ON integracao_vendas(data, fonte);

-- 7. VERIFICAR RESULTADO
SELECT 
    'integracao_vendas' as tabela,
    COUNT(*) as total_registros
FROM integracao_vendas;

-- 8. MOSTRAR ESTRUTURA DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'integracao_vendas' 
AND table_schema = 'public'
ORDER BY ordinal_position;