-- =====================================================
-- SQL COMPLETA DO SISTEMA - TODAS AS TABELAS
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
    
    -- Criar enum para status de CA se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_ca_enum') THEN
        CREATE TYPE status_ca_enum AS ENUM ('ativo', 'inativo', 'pendente');
    END IF;
    
    -- Criar enum para humor se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'humor_enum') THEN
        CREATE TYPE humor_enum AS ENUM ('feliz', 'triste', 'neutro', 'estressado', 'animado');
    END IF;
    
    -- Criar enum para tipo de instituto se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_instituto_enum') THEN
        CREATE TYPE tipo_instituto_enum AS ENUM ('instituto', 'faculdade', 'centro');
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

-- 3. TABELA CAMARADAS
CREATE TABLE IF NOT EXISTS camaradas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefone VARCHAR(20),
    turno turno_enum NOT NULL,
    instituto_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA INSTITUTOS
CREATE TABLE IF NOT EXISTS institutos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    tipo tipo_instituto_enum DEFAULT 'instituto',
    turno turno_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA CENTROS ACADÊMICOS
CREATE TABLE IF NOT EXISTS centros_academicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(10) UNIQUE NOT NULL,
    instituto_id UUID REFERENCES institutos(id) ON DELETE CASCADE,
    status status_ca_enum DEFAULT 'ativo',
    presidente_id UUID REFERENCES camaradas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA ESCALAS
CREATE TABLE IF NOT EXISTS escalas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camarada_id UUID NOT NULL REFERENCES camaradas(id) ON DELETE CASCADE,
    instituto_id UUID NOT NULL REFERENCES institutos(id) ON DELETE CASCADE,
    dia dia_semana_enum NOT NULL,
    turno turno_enum NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(camarada_id, instituto_id, dia, turno, data_inicio)
);

-- 7. TABELA PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco_unitario DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(10) NOT NULL, -- kg, ml, unidade, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA INSUMOS (INGREDIENTES DOS PRODUTOS)
CREATE TABLE IF NOT EXISTS insumos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    ingrediente_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade DECIMAL(10,3) NOT NULL,
    unidade VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produto_id, ingrediente_id)
);

-- 9. TABELA HUMOR CAMARADAS
CREATE TABLE IF NOT EXISTS humor_camaradas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camarada_id UUID NOT NULL REFERENCES camaradas(id) ON DELETE CASCADE,
    humor humor_enum NOT NULL,
    data_registro DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(camarada_id, data_registro)
);

-- 10. TABELAS ESPECÍFICAS DE VENDAS
-- 10.1 Institutos de Vendas
CREATE TABLE IF NOT EXISTS institutos_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    turno turno_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10.2 Projeções de Vendas
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

-- 10.3 Metas de Vendas
CREATE TABLE IF NOT EXISTS metas_vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo_periodo VARCHAR(20) NOT NULL CHECK (tipo_periodo IN ('diaria', 'semanal', 'mensal', 'semestral')),
    instituto_id UUID NOT NULL REFERENCES institutos_vendas(id) ON DELETE CASCADE,
    quantidade_meta INTEGER NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10.4 Análise de Oferta e Demanda
CREATE TABLE IF NOT EXISTS analise_oferta_demanda (
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

-- 11. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE camaradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutos ENABLE ROW LEVEL SECURITY;
ALTER TABLE centros_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE humor_camaradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutos_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecoes_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE analise_oferta_demanda ENABLE ROW LEVEL SECURITY;

-- 12. CRIAR POLÍTICAS RLS
CREATE POLICY "Usuários autenticados podem gerenciar camaradas" ON camaradas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar institutos" ON institutos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar centros_academicos" ON centros_academicos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar escalas" ON escalas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar produtos" ON produtos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar insumos" ON insumos
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar humor_camaradas" ON humor_camaradas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar institutos_vendas" ON institutos_vendas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar projecoes_vendas" ON projecoes_vendas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar metas_vendas" ON metas_vendas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem gerenciar analise_oferta_demanda" ON analise_oferta_demanda
    FOR ALL USING (auth.role() = 'authenticated');

-- 13. CRIAR TRIGGERS PARA updated_at
CREATE TRIGGER update_camaradas_updated_at
    BEFORE UPDATE ON camaradas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutos_updated_at
    BEFORE UPDATE ON institutos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_centros_academicos_updated_at
    BEFORE UPDATE ON centros_academicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escalas_updated_at
    BEFORE UPDATE ON escalas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insumos_updated_at
    BEFORE UPDATE ON insumos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_humor_camaradas_updated_at
    BEFORE UPDATE ON humor_camaradas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutos_vendas_updated_at
    BEFORE UPDATE ON institutos_vendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projecoes_vendas_updated_at
    BEFORE UPDATE ON projecoes_vendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_vendas_updated_at
    BEFORE UPDATE ON metas_vendas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analise_oferta_demanda_updated_at
    BEFORE UPDATE ON analise_oferta_demanda
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. INSERIR DADOS INICIAIS

-- 14.1 Institutos básicos
INSERT INTO institutos (nome, codigo, tipo, turno) VALUES
('Instituto de Artes e Design', 'IAD', 'instituto', 'manha'),
('Instituto de Artes e Design', 'IAD', 'instituto', 'tarde'),
('Direito', 'DIR', 'faculdade', 'manha'),
('Direito', 'DIR', 'faculdade', 'tarde'),
('Direito', 'DIR', 'faculdade', 'noite'),
('Enfermagem', 'ENF', 'faculdade', 'manha'),
('Enfermagem', 'ENF', 'faculdade', 'tarde'),
('Biologia', 'BIO', 'instituto', 'manha'),
('Biologia', 'BIO', 'instituto', 'tarde'),
('Instituto de Ciências Humanas', 'ICH', 'instituto', 'manha'),
('Instituto de Ciências Humanas', 'ICH', 'instituto', 'tarde'),
('Instituto de Ciências Humanas', 'ICH', 'instituto', 'noite'),
('Instituto de Ciências Exatas', 'ICE', 'instituto', 'manha'),
('Instituto de Ciências Exatas', 'ICE', 'instituto', 'tarde'),
('Faculdade de Arquitetura e Urbanismo', 'FAU', 'faculdade', 'manha'),
('Faculdade de Arquitetura e Urbanismo', 'FAU', 'faculdade', 'tarde'),
('Faculdade de Medicina', 'FAMED', 'faculdade', 'manha'),
('Faculdade de Medicina', 'FAMED', 'faculdade', 'tarde'),
('Faculdade de Educação', 'FACED', 'faculdade', 'manha'),
('Faculdade de Educação', 'FACED', 'faculdade', 'tarde'),
('Faculdade de Educação', 'FACED', 'faculdade', 'noite'),
('Faculdade de Comunicação', 'FACOM', 'faculdade', 'manha'),
('Faculdade de Comunicação', 'FACOM', 'faculdade', 'tarde')
ON CONFLICT (codigo) DO NOTHING;

-- 14.2 Institutos específicos para vendas
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

-- 14.3 Produtos básicos
INSERT INTO produtos (nome, descricao, preco_unitario, unidade) VALUES
('Café', 'Café tradicional', 5.00, 'unidade'),
('Sanduíche', 'Sanduíche natural', 8.50, 'unidade'),
('Refrigerante', 'Refrigerante 350ml', 4.00, 'unidade'),
('Água', 'Água mineral 500ml', 3.00, 'unidade'),
('Bolo', 'Bolo caseiro', 6.00, 'unidade'),
('Pão de Queijo', 'Pão de queijo tradicional', 2.50, 'unidade'),
('Suco', 'Suco natural 300ml', 5.50, 'unidade'),
('Salgadinho', 'Salgadinho assado', 3.50, 'unidade')
ON CONFLICT DO NOTHING;

-- 15. VERIFICAR ESTRUTURA FINAL
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 16. CONTAR REGISTROS
SELECT 
    'camaradas' as tabela,
    COUNT(*) as total_registros
FROM camaradas
UNION ALL
SELECT 
    'institutos' as tabela,
    COUNT(*) as total_registros
FROM institutos
UNION ALL
SELECT 
    'centros_academicos' as tabela,
    COUNT(*) as total_registros
FROM centros_academicos
UNION ALL
SELECT 
    'escalas' as tabela,
    COUNT(*) as total_registros
FROM escalas
UNION ALL
SELECT 
    'produtos' as tabela,
    COUNT(*) as total_registros
FROM produtos
UNION ALL
SELECT 
    'insumos' as tabela,
    COUNT(*) as total_registros
FROM insumos
UNION ALL
SELECT 
    'humor_camaradas' as tabela,
    COUNT(*) as total_registros
FROM humor_camaradas
UNION ALL
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