-- =====================================================
-- SCRIPT SQL PARA CRIAR COLUNA horarios_disponiveis
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. ADICIONAR A COLUNA horarios_disponiveis
ALTER TABLE camaradas 
ADD COLUMN IF NOT EXISTS horarios_disponiveis JSONB DEFAULT NULL;

-- 2. COMENTÁRIO EXPLICATIVO
COMMENT ON COLUMN camaradas.horarios_disponiveis IS 'Array de objetos com dia e turno específicos de disponibilidade. Ex: [{"dia": "seg", "turno": "manha"}, {"dia": "ter", "turno": "tarde"}]';

-- 3. VERIFICAR SE A COLUNA FOI CRIADA
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'camaradas' 
AND column_name = 'horarios_disponiveis';

-- 4. TESTAR INSERÇÃO DE DADOS
INSERT INTO camaradas (nome, curso, turnos, horarios_disponiveis) 
VALUES (
  'TESTE_HORARIOS', 
  'TESTE', 
  ARRAY['manha', 'tarde'], 
  '[{"dia": "seg", "turno": "manha"}, {"dia": "ter", "turno": "tarde"}]'::jsonb
);

-- 5. VERIFICAR SE A INSERÇÃO FUNCIONOU
SELECT id, nome, curso, turnos, horarios_disponiveis 
FROM camaradas 
WHERE nome = 'TESTE_HORARIOS';

-- 6. LIMPAR DADOS DE TESTE (OPCIONAL)
-- DELETE FROM camaradas WHERE nome = 'TESTE_HORARIOS';

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Acesse o painel do Supabase
-- 3. Vá em "SQL Editor"
-- 4. Cole o script completo
-- 5. Execute (Run)
-- 6. Verifique se não há erros
-- =====================================================