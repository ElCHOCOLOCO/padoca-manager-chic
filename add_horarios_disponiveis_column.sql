-- Script SQL para adicionar a coluna horarios_disponiveis na tabela camaradas
-- Execute este script no SQL Editor do Supabase

-- Adicionar a coluna horarios_disponiveis como JSONB
ALTER TABLE camaradas 
ADD COLUMN IF NOT EXISTS horarios_disponiveis JSONB DEFAULT NULL;

-- Comentário explicativo da coluna
COMMENT ON COLUMN camaradas.horarios_disponiveis IS 'Array de objetos com dia e turno específicos de disponibilidade. Ex: [{"dia": "seg", "turno": "manha"}, {"dia": "ter", "turno": "tarde"}]';

-- Exemplo de como os dados ficarão:
-- horarios_disponiveis: [
--   {"dia": "seg", "turno": "manha"},
--   {"dia": "ter", "turno": "tarde"},
--   {"dia": "qui", "turno": "noite"}
-- ]

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'camaradas' 
AND column_name = 'horarios_disponiveis';