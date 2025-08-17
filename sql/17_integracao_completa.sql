-- =====================================================
-- INTEGRAÇÃO COMPLETA MARX VENDAS
-- =====================================================

-- 1. ENUMS NECESSÁRIOS
DO $$
BEGIN
    -- Enum para turnos
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turno_enum') THEN
        CREATE TYPE turno_enum AS ENUM ('M', 'T', 'N');
        RAISE NOTICE 'Enum turno_enum criado com sucesso!';
    ELSE
        RAISE NOTICE 'Enum turno_enum já existe!';
    END IF;

    -- Enum para dias da semana
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dia_semana_enum') THEN
        CREATE TYPE dia_semana_enum AS ENUM ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo');
        RAISE NOTICE 'Enum dia_semana_enum criado com sucesso!';
    ELSE
        RAISE NOTICE 'Enum dia_semana_enum já existe!';
    END IF;
END $$;

-- 2. FUNÇÃO UPDATE_UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. TABELA INSTITUTOS_VENDAS
CREATE TABLE IF NOT EXISTS institutos_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    turno turno_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA PROJEÇÕES_VENDAS
CREATE TABLE IF NOT EXISTS projecoes_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instituto_id UUID REFERENCES institutos_vendas(id) ON DELETE CASCADE,
    data_referencia DATE NOT NULL,
    dia_semana dia_semana_enum NOT NULL,
    projecao INTEGER NOT NULL DEFAULT 0 CHECK (projecao >= 0),
    vendas_reais INTEGER NOT NULL DEFAULT 0 CHECK (vendas_reais >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(instituto_id, data_referencia)
);

-- 5. TABELA VENDAS_DETALHADAS
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

-- 6. HABILITAR RLS
ALTER TABLE institutos_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_detalhadas ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS
DO $$
BEGIN
    -- Política para institutos_vendas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'institutos_vendas' 
        AND policyname = 'Usuários autenticados podem gerenciar institutos_vendas'
    ) THEN
        CREATE POLICY "Usuários autenticados podem gerenciar institutos_vendas" ON institutos_vendas
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política para institutos_vendas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Política para institutos_vendas já existe!';
    END IF;

    -- Política para projecoes_vendas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projecoes_vendas' 
        AND policyname = 'Usuários autenticados podem gerenciar projecoes_vendas'
    ) THEN
        CREATE POLICY "Usuários autenticados podem gerenciar projecoes_vendas" ON projecoes_vendas
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política para projecoes_vendas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Política para projecoes_vendas já existe!';
    END IF;

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

-- 8. CRIAR TRIGGERS
DO $$
BEGIN
    -- Trigger para institutos_vendas
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_institutos_vendas_updated_at'
    ) THEN
        CREATE TRIGGER update_institutos_vendas_updated_at
            BEFORE UPDATE ON institutos_vendas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger para institutos_vendas criado com sucesso!';
    ELSE
        RAISE NOTICE 'Trigger para institutos_vendas já existe!';
    END IF;

    -- Trigger para projecoes_vendas
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_projecoes_vendas_updated_at'
    ) THEN
        CREATE TRIGGER update_projecoes_vendas_updated_at
            BEFORE UPDATE ON projecoes_vendas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger para projecoes_vendas criado com sucesso!';
    ELSE
        RAISE NOTICE 'Trigger para projecoes_vendas já existe!';
    END IF;

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

-- 9. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_institutos_vendas_codigo ON institutos_vendas(codigo);
CREATE INDEX IF NOT EXISTS idx_projecoes_vendas_data ON projecoes_vendas(data_referencia);
CREATE INDEX IF NOT EXISTS idx_projecoes_vendas_instituto ON projecoes_vendas(instituto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_detalhadas_data ON vendas_detalhadas(data);
CREATE INDEX IF NOT EXISTS idx_vendas_detalhadas_lucro ON vendas_detalhadas(lucro_dia);

-- 10. CRIAR VIEW PARA RESUMO
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

-- 11. INSERIR INSTITUTOS (SE NÃO EXISTIREM)
DO $$
BEGIN
    -- Lista de institutos
    IF NOT EXISTS (SELECT 1 FROM institutos_vendas WHERE codigo = 'IAD M') THEN
        INSERT INTO institutos_vendas (codigo, nome, turno) VALUES
        ('IAD M', 'IAD Manhã', 'M'),
        ('IAD T', 'IAD Tarde', 'T'),
        ('DIR M', 'DIR Manhã', 'M'),
        ('DIR T', 'DIR Tarde', 'T'),
        ('DIR N', 'DIR Noite', 'N'),
        ('ENF M', 'ENF Manhã', 'M'),
        ('ENF T', 'ENF Tarde', 'T'),
        ('BIO M', 'BIO Manhã', 'M'),
        ('BIO T', 'BIO Tarde', 'T'),
        ('ICH M', 'ICH Manhã', 'M'),
        ('ICH T', 'ICH Tarde', 'T'),
        ('ICH N', 'ICH Noite', 'N'),
        ('ICE M', 'ICE Manhã', 'M'),
        ('ICE T', 'ICE Tarde', 'T'),
        ('FAU M', 'FAU Manhã', 'M'),
        ('FAU T', 'FAU Tarde', 'T'),
        ('FAMED M', 'FAMED Manhã', 'M'),
        ('FAMED T', 'FAMED Tarde', 'T'),
        ('FACED M', 'FACED Manhã', 'M'),
        ('FACED T', 'FACED Tarde', 'T'),
        ('FACED N', 'FACED Noite', 'N'),
        ('FACOM M', 'FACOM Manhã', 'M'),
        ('FACOM T', 'FACOM Tarde', 'T');
        RAISE NOTICE 'Institutos inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Institutos já existem!';
    END IF;
END $$;

-- 12. DESABILITAR RLS PARA DESENVOLVIMENTO
ALTER TABLE institutos_vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_detalhadas DISABLE ROW LEVEL SECURITY;

-- 13. VERIFICAR RESULTADO FINAL
SELECT 
    'institutos_vendas' as tabela,
    COUNT(*) as total_registros,
    'RLS Desabilitado' as status
FROM institutos_vendas
UNION ALL
SELECT 
    'projecoes_vendas' as tabela,
    COUNT(*) as total_registros,
    'RLS Desabilitado' as status
FROM projecoes_vendas
UNION ALL
SELECT 
    'vendas_detalhadas' as tabela,
    COUNT(*) as total_registros,
    'RLS Desabilitado' as status
FROM vendas_detalhadas;

-- 14. TESTAR VIEW
SELECT * FROM resumo_vendas_diarias LIMIT 3;