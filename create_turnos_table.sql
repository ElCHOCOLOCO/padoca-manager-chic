-- Criar tabela de turnos individuais
CREATE TABLE IF NOT EXISTS turnos_disponiveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  camarada_id UUID NOT NULL REFERENCES camaradas(id) ON DELETE CASCADE,
  dia TEXT NOT NULL CHECK (dia IN ('seg', 'ter', 'qua', 'qui', 'sex')),
  turno TEXT NOT NULL CHECK (turno IN ('manha', 'tarde', 'noite')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(camarada_id, dia, turno)
);

-- Comentários para documentação
COMMENT ON TABLE turnos_disponiveis IS 'Tabela que armazena cada turno individual (dia + horário) disponível para cada camarada';
COMMENT ON COLUMN turnos_disponiveis.camarada_id IS 'ID do camarada';
COMMENT ON COLUMN turnos_disponiveis.dia IS 'Dia da semana (seg, ter, qua, qui, sex)';
COMMENT ON COLUMN turnos_disponiveis.turno IS 'Turno do dia (manha, tarde, noite)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_turnos_camarada_id ON turnos_disponiveis(camarada_id);
CREATE INDEX IF NOT EXISTS idx_turnos_dia ON turnos_disponiveis(dia);
CREATE INDEX IF NOT EXISTS idx_turnos_turno ON turnos_disponiveis(turno);
CREATE INDEX IF NOT EXISTS idx_turnos_dia_turno ON turnos_disponiveis(dia, turno);

-- RLS Policies
ALTER TABLE turnos_disponiveis ENABLE ROW LEVEL SECURITY;

-- Policy para leitura (todos podem ler)
CREATE POLICY "Enable read access for all users" ON turnos_disponiveis
  FOR SELECT USING (true);

-- Policy para inserção (usuários autenticados)
CREATE POLICY "Enable insert for authenticated users" ON turnos_disponiveis
  FOR INSERT WITH CHECK (true);

-- Policy para atualização (usuários autenticados)
CREATE POLICY "Enable update for authenticated users" ON turnos_disponiveis
  FOR UPDATE USING (true);

-- Policy para exclusão (usuários autenticados)
CREATE POLICY "Enable delete for authenticated users" ON turnos_disponiveis
  FOR DELETE USING (true);

-- Função para popular a tabela baseada nos dados existentes
CREATE OR REPLACE FUNCTION populate_turnos_from_existing_data()
RETURNS void AS $$
DECLARE
  camarada_record RECORD;
  turno_record TEXT;
  dia_record TEXT;
BEGIN
  -- Limpar tabela existente
  DELETE FROM turnos_disponiveis;
  
  -- Para cada camarada
  FOR camarada_record IN SELECT id, turnos, horarios_disponiveis FROM camaradas LOOP
    
    -- Se tem horários específicos, usar eles
    IF camarada_record.horarios_disponiveis IS NOT NULL THEN
      -- Inserir cada horário específico
      FOR dia_record IN SELECT jsonb_array_elements_text(jsonb_path_query_array(camarada_record.horarios_disponiveis, '$[*].dia')) LOOP
        INSERT INTO turnos_disponiveis (camarada_id, dia, turno)
        SELECT 
          camarada_record.id,
          dia_record,
          jsonb_path_query_first(camarada_record.horarios_disponiveis, '$[*] ? (@.dia == $dia).turno', jsonb_build_object('dia', dia_record)) #>> '{}'
        WHERE jsonb_path_query_first(camarada_record.horarios_disponiveis, '$[*] ? (@.dia == $dia).turno', jsonb_build_object('dia', dia_record)) IS NOT NULL;
      END LOOP;
    ELSE
      -- Se não tem horários específicos, usar turnos gerais
      IF camarada_record.turnos IS NOT NULL THEN
        -- Para cada turno geral, criar 5 registros (seg, ter, qua, qui, sex)
        FOR turno_record IN SELECT unnest(camarada_record.turnos) LOOP
          INSERT INTO turnos_disponiveis (camarada_id, dia, turno)
          VALUES 
            (camarada_record.id, 'seg', turno_record),
            (camarada_record.id, 'ter', turno_record),
            (camarada_record.id, 'qua', turno_record),
            (camarada_record.id, 'qui', turno_record),
            (camarada_record.id, 'sex', turno_record);
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para popular os dados
SELECT populate_turnos_from_existing_data();

-- Verificar os dados inseridos
SELECT 
  COUNT(*) as total_turnos,
  COUNT(CASE WHEN turno = 'manha' THEN 1 END) as turnos_manha,
  COUNT(CASE WHEN turno = 'tarde' THEN 1 END) as turnos_tarde,
  COUNT(CASE WHEN turno = 'noite' THEN 1 END) as turnos_noite
FROM turnos_disponiveis;