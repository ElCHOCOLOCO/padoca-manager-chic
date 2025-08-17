-- =====================================================
-- VERIFICAR E CRIAR TABELAS ESPECÍFICAS DE VENDAS
-- =====================================================

-- 1. Verificar se a tabela institutos_vendas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'institutos_vendas') THEN
        -- Criar tabela institutos_vendas
        CREATE TABLE institutos_vendas (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            codigo VARCHAR(10) UNIQUE NOT NULL,
            nome VARCHAR(100) NOT NULL,
            turno turno_enum NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE institutos_vendas ENABLE ROW LEVEL SECURITY;

        -- Criar política RLS
        CREATE POLICY "Usuários autenticados podem gerenciar institutos_vendas" ON institutos_vendas
            FOR ALL USING (auth.role() = 'authenticated');

        -- Criar trigger para updated_at
        CREATE TRIGGER update_institutos_vendas_updated_at
            BEFORE UPDATE ON institutos_vendas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabela institutos_vendas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela institutos_vendas já existe!';
    END IF;
END $$;

-- 2. Verificar se a tabela projecoes_vendas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projecoes_vendas') THEN
        -- Criar tabela projecoes_vendas
        CREATE TABLE projecoes_vendas (
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

        -- Habilitar RLS
        ALTER TABLE projecoes_vendas ENABLE ROW LEVEL SECURITY;

        -- Criar política RLS
        CREATE POLICY "Usuários autenticados podem gerenciar projecoes_vendas" ON projecoes_vendas
            FOR ALL USING (auth.role() = 'authenticated');

        -- Criar trigger para updated_at
        CREATE TRIGGER update_projecoes_vendas_updated_at
            BEFORE UPDATE ON projecoes_vendas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabela projecoes_vendas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela projecoes_vendas já existe!';
    END IF;
END $$;

-- 3. Verificar se a tabela metas_vendas existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'metas_vendas') THEN
        -- Criar tabela metas_vendas
        CREATE TABLE metas_vendas (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tipo_periodo VARCHAR(20) NOT NULL CHECK (tipo_periodo IN ('diaria', 'semanal', 'mensal', 'semestral')),
            instituto_id UUID NOT NULL REFERENCES institutos_vendas(id) ON DELETE CASCADE,
            quantidade_meta INTEGER NOT NULL,
            periodo_inicio DATE NOT NULL,
            periodo_fim DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE metas_vendas ENABLE ROW LEVEL SECURITY;

        -- Criar política RLS
        CREATE POLICY "Usuários autenticados podem gerenciar metas_vendas" ON metas_vendas
            FOR ALL USING (auth.role() = 'authenticated');

        -- Criar trigger para updated_at
        CREATE TRIGGER update_metas_vendas_updated_at
            BEFORE UPDATE ON metas_vendas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabela metas_vendas criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela metas_vendas já existe!';
    END IF;
END $$;

-- 4. Verificar se a tabela analise_oferta_demanda existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analise_oferta_demanda') THEN
        -- Criar tabela analise_oferta_demanda
        CREATE TABLE analise_oferta_demanda (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            instituto_id UUID NOT NULL REFERENCES institutos_vendas(id) ON DELETE CASCADE,
            dia dia_semana_enum NOT NULL,
            turno turno_enum NOT NULL,
            oferta_disponivel INTEGER NOT NULL,
            demanda_esperada INTEGER NOT NULL,
            data_referencia DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(instituto_id, dia, turno, data_referencia)
        );

        -- Habilitar RLS
        ALTER TABLE analise_oferta_demanda ENABLE ROW LEVEL SECURITY;

        -- Criar política RLS
        CREATE POLICY "Usuários autenticados podem gerenciar analise_oferta_demanda" ON analise_oferta_demanda
            FOR ALL USING (auth.role() = 'authenticated');

        -- Criar trigger para updated_at
        CREATE TRIGGER update_analise_oferta_demanda_updated_at
            BEFORE UPDATE ON analise_oferta_demanda
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Tabela analise_oferta_demanda criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela analise_oferta_demanda já existe!';
    END IF;
END $$;

-- 5. Verificar se os institutos já existem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM institutos_vendas LIMIT 1) THEN
        -- Inserir os institutos específicos para vendas
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

-- 6. Verificar estrutura final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('institutos_vendas', 'projecoes_vendas', 'metas_vendas', 'analise_oferta_demanda')
ORDER BY table_name, ordinal_position;

-- 7. Contar registros
SELECT 
    'institutos_vendas' as tabela,
    COUNT(*) as total_registros
FROM institutos_vendas
UNION ALL
SELECT 
    'projecoes_vendas' as tabela,
    COUNT(*) as total_registros
FROM projecoes_vendas
UNION ALL
SELECT 
    'metas_vendas' as tabela,
    COUNT(*) as total_registros
FROM metas_vendas
UNION ALL
SELECT 
    'analise_oferta_demanda' as tabela,
    COUNT(*) as total_registros
FROM analise_oferta_demanda;