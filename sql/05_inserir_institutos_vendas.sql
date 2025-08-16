-- =====================================================
-- INSERIR INSTITUTOS DE VENDAS
-- =====================================================

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

-- Verificar se os institutos foram inseridos
SELECT 
    codigo,
    nome,
    turno,
    created_at
FROM institutos_vendas 
ORDER BY codigo;

-- Contar total de institutos inseridos
SELECT COUNT(*) as total_institutos_vendas FROM institutos_vendas;