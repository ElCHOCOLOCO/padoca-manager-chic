-- =====================================================
-- SQL VENDAS SEM ERROS - VERIFICA EXISTÊNCIA ANTES DE CRIAR
-- =====================================================

-- 1. ENUMS NECESSÁRIOS
DO $$
BEGIN
    -- Criar enum para turnos se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turno_enum') THEN
        CREATE TYPE turno_enum AS ENUM ('manha', 'tarde', 'noite');
    END IF;
    
    -- Criar enum para dias da semana se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dia_semana_enum') THEN
        CREATE TYPE dia_semana_enum AS ENUM ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom');
    END IF;
END $$;

-- 2. FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. TABELA INSTITUTOS DE VENDAS
CREATE TABLE IF NOT EXISTS institutos_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    turno turno_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA PROJEÇÕES DE VENDAS
CREATE TABLE IF NOT EXISTS projecoes_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instituto_id UUID NOT NULL REFERENCES institutos_vendas(id) ON DELETE CASCADE,
    dia dia_semana_enum NOT NULL,
    turno turno_enum NOT NULL,
    projecao_quantidade INTEGER DEFAULT 0,
    vendas_reais INTEGER DEFAULT 0,
    data_referencia DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(instituto_id, dia, turno, data_referencia)
);

-- 5. HABILITAR RLS
ALTER TABLE institutos_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_vendas ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS (VERIFICANDO SE JÁ EXISTEM)
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
END $$;

-- 7. CRIAR TRIGGERS (VERIFICANDO SE JÁ EXISTEM)
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
END $$;

-- 8. INSERIR INSTITUTOS (SE NÃO EXISTIREM)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM institutos_vendas LIMIT 1) THEN
        INSERT INTO institutos_vendas (codigo, nome, turno) VALUES
        -- IAD - Instituto de Artes e Design
        ('IAD M', 'Instituto de Artes e Design', 'manha'),
        ('IAD T', 'Instituto de Artes e Design', 'tarde'),

        -- DIR - Direito
        ('DIR M', 'Direito', 'manha'),
        ('DIR T', 'Direito', 'tarde'),
        ('DIR N', 'Direito', 'noite'),

        -- ENF - Enfermagem
        ('ENF M', 'Enfermagem', 'manha'),
        ('ENF T', 'Enfermagem', 'tarde'),

        -- BIO - Biologia
        ('BIO M', 'Biologia', 'manha'),
        ('BIO T', 'Biologia', 'tarde'),

        -- ICH - Instituto de Ciências Humanas
        ('ICH M', 'Instituto de Ciências Humanas', 'manha'),
        ('ICH T', 'Instituto de Ciências Humanas', 'tarde'),
        ('ICH N', 'Instituto de Ciências Humanas', 'noite'),

        -- ICE - Instituto de Ciências Exatas
        ('ICE M', 'Instituto de Ciências Exatas', 'manha'),
        ('ICE T', 'Instituto de Ciências Exatas', 'tarde'),

        -- FAU - Faculdade de Arquitetura e Urbanismo
        ('FAU M', 'Faculdade de Arquitetura e Urbanismo', 'manha'),
        ('FAU T', 'Faculdade de Arquitetura e Urbanismo', 'tarde'),

        -- FAMED - Faculdade de Medicina
        ('FAMED M', 'Faculdade de Medicina', 'manha'),
        ('FAMED T', 'Faculdade de Medicina', 'tarde'),

        -- FACED - Faculdade de Educação
        ('FACED M', 'Faculdade de Educação', 'manha'),
        ('FACED T', 'Faculdade de Educação', 'tarde'),
        ('FACED N', 'Faculdade de Educação', 'noite'),

        -- FACOM - Faculdade de Comunicação
        ('FACOM M', 'Faculdade de Comunicação', 'manha'),
        ('FACOM T', 'Faculdade de Comunicação', 'tarde')
        ON CONFLICT (codigo) DO NOTHING;

        RAISE NOTICE 'Institutos inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Institutos já existem!';
    END IF;
END $$;

-- 9. VERIFICAR RESULTADO FINAL
SELECT 
    'institutos_vendas' as tabela,
    COUNT(*) as total_registros
FROM institutos_vendas
UNION ALL
SELECT 
    'projecoes_vendas' as tabela,
    COUNT(*) as total_registros
FROM projecoes_vendas;

-- 10. MOSTRAR INSTITUTOS CRIADOS
SELECT codigo, nome, turno FROM institutos_vendas ORDER BY codigo;

-- 11. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('institutos_vendas', 'projecoes_vendas')
ORDER BY table_name, ordinal_position;