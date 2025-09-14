-- Script SQL completo para implementar horários específicos de camaradas
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar a coluna horarios_disponiveis na tabela camaradas
ALTER TABLE camaradas 
ADD COLUMN IF NOT EXISTS horarios_disponiveis JSONB DEFAULT NULL;

-- 2. Comentário explicativo da coluna
COMMENT ON COLUMN camaradas.horarios_disponiveis IS 'Array de objetos com dia e turno específicos de disponibilidade. Ex: [{"dia": "seg", "turno": "manha"}, {"dia": "ter", "turno": "tarde"}]';

-- 3. Criar função para validar formato dos horários disponíveis
CREATE OR REPLACE FUNCTION validate_horarios_disponiveis(horarios JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se for NULL, é válido (opcional)
  IF horarios IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Se não for um array, é inválido
  IF jsonb_typeof(horarios) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar cada item do array
  FOR i IN 0..jsonb_array_length(horarios) - 1 LOOP
    DECLARE
      item JSONB := horarios->i;
    BEGIN
      -- Cada item deve ser um objeto
      IF jsonb_typeof(item) != 'object' THEN
        RETURN FALSE;
      END IF;
      
      -- Deve ter 'dia' e 'turno'
      IF NOT (item ? 'dia' AND item ? 'turno') THEN
        RETURN FALSE;
      END IF;
      
      -- Validar valores de dia
      IF NOT (item->>'dia' IN ('seg', 'ter', 'qua', 'qui', 'sex')) THEN
        RETURN FALSE;
      END IF;
      
      -- Validar valores de turno
      IF NOT (item->>'turno' IN ('manha', 'tarde', 'noite')) THEN
        RETURN FALSE;
      END IF;
    END;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar constraint para validar horarios_disponiveis
ALTER TABLE camaradas 
ADD CONSTRAINT check_horarios_disponiveis_format 
CHECK (validate_horarios_disponiveis(horarios_disponiveis));

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_camaradas_horarios_disponiveis 
ON camaradas USING GIN (horarios_disponiveis);

-- 6. Criar função para buscar camaradas disponíveis em um horário específico
CREATE OR REPLACE FUNCTION get_camaradas_disponiveis(
  p_dia TEXT,
  p_turno TEXT
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  curso TEXT,
  turnos TEXT[],
  horarios_disponiveis JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    c.curso,
    c.turnos,
    c.horarios_disponiveis
  FROM camaradas c
  WHERE 
    -- Se não tem horários específicos, usa turnos gerais
    (c.horarios_disponiveis IS NULL OR jsonb_array_length(c.horarios_disponiveis) = 0)
    AND c.turnos @> ARRAY[p_turno]::TEXT[]
    OR
    -- Se tem horários específicos, verifica se está disponível
    (c.horarios_disponiveis IS NOT NULL 
     AND jsonb_array_length(c.horarios_disponiveis) > 0
     AND EXISTS (
       SELECT 1 
       FROM jsonb_array_elements(c.horarios_disponiveis) AS elem
       WHERE elem->>'dia' = p_dia 
       AND elem->>'turno' = p_turno
     ));
END;
$$ LANGUAGE plpgsql;

-- 7. Criar view para facilitar consultas
CREATE OR REPLACE VIEW v_camaradas_com_horarios AS
SELECT 
  c.id,
  c.nome,
  c.curso,
  c.turnos,
  c.horarios_disponiveis,
  c.created_at,
  -- Contar quantos horários específicos tem
  CASE 
    WHEN c.horarios_disponiveis IS NULL THEN 0
    ELSE jsonb_array_length(c.horarios_disponiveis)
  END as total_horarios_especificos
FROM camaradas c;

-- 8. Atualizar políticas RLS (Row Level Security) se necessário
-- Verificar se RLS está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'camaradas' 
    AND relrowsecurity = true
  ) THEN
    -- Habilitar RLS se não estiver habilitado
    ALTER TABLE camaradas ENABLE ROW LEVEL SECURITY;
    
    -- Criar política para permitir todas as operações (ajuste conforme necessário)
    CREATE POLICY "Allow all operations on camaradas" ON camaradas
    FOR ALL USING (true);
  END IF;
END $$;

-- 9. Criar trigger para atualizar timestamp quando horarios_disponiveis for modificado
CREATE OR REPLACE FUNCTION update_camarada_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna updated_at se não existir
ALTER TABLE camaradas 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_camarada_timestamp ON camaradas;
CREATE TRIGGER trigger_update_camarada_timestamp
  BEFORE UPDATE ON camaradas
  FOR EACH ROW
  EXECUTE FUNCTION update_camarada_timestamp();

-- 10. Inserir dados de exemplo (opcional - remover se não quiser)
-- INSERT INTO camaradas (nome, curso, turnos, horarios_disponiveis) VALUES
-- ('João Silva', 'Engenharia', ARRAY['manha', 'tarde'], 
--  '[{"dia": "seg", "turno": "manha"}, {"dia": "ter", "turno": "tarde"}]'::jsonb),
-- ('Maria Santos', 'Medicina', ARRAY['tarde', 'noite'], 
--  '[{"dia": "qua", "turno": "tarde"}, {"dia": "qui", "turno": "noite"}]'::jsonb);

-- 11. Verificar se tudo foi criado corretamente
SELECT 
  'Schema criado com sucesso!' as status,
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'camaradas' 
AND column_name = 'horarios_disponiveis';

-- 12. Testar a função de busca
SELECT 'Teste da função:' as info;
SELECT * FROM get_camaradas_disponiveis('seg', 'manha') LIMIT 3;

-- 13. Verificar a view
SELECT 'Teste da view:' as info;
SELECT * FROM v_camaradas_com_horarios LIMIT 3;