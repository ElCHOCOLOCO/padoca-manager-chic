-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- =====================================================

-- Índices para Tabela `camaradas`
CREATE INDEX IF NOT EXISTS idx_camaradas_nome ON camaradas USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_camaradas_curso ON camaradas(curso);
CREATE INDEX IF NOT EXISTS idx_camaradas_turnos ON camaradas USING gin(turnos);
CREATE INDEX IF NOT EXISTS idx_camaradas_nome_curso ON camaradas(nome, curso);

-- Índices para Tabela `institutos`
CREATE INDEX IF NOT EXISTS idx_institutos_nome ON institutos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_institutos_tipo ON institutos(tipo);

-- Índices para Tabela `cas`
CREATE INDEX IF NOT EXISTS idx_cas_nome ON cas USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_cas_status ON cas(status);
CREATE INDEX IF NOT EXISTS idx_cas_humor ON cas(humor);
CREATE INDEX IF NOT EXISTS idx_cas_status_humor ON cas(status, humor);

-- Índices para Tabela `escala`
CREATE INDEX IF NOT EXISTS idx_escala_camarada_id ON escala(camarada_id);
CREATE INDEX IF NOT EXISTS idx_escala_instituto_id ON escala(instituto_id);
CREATE INDEX IF NOT EXISTS idx_escala_dia ON escala(dia);
CREATE INDEX IF NOT EXISTS idx_escala_turno ON escala(turno);
CREATE INDEX IF NOT EXISTS idx_escala_camarada_dia_turno ON escala(camarada_id, dia, turno);
CREATE INDEX IF NOT EXISTS idx_escala_instituto_dia_turno ON escala(instituto_id, dia, turno);
CREATE INDEX IF NOT EXISTS idx_escala_created_at ON escala(created_at);

-- Índices para Tabela `insumo_recipes`
CREATE INDEX IF NOT EXISTS idx_insumo_recipes_name ON insumo_recipes USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_insumo_recipes_user_id ON insumo_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_insumo_recipes_created_at ON insumo_recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_insumo_recipes_user_created ON insumo_recipes(user_id, created_at DESC);

-- Índices para Tabela `insumo_recipe_items`
CREATE INDEX IF NOT EXISTS idx_insumo_recipe_items_recipe_id ON insumo_recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_insumo_recipe_items_idx ON insumo_recipe_items(idx);
CREATE INDEX IF NOT EXISTS idx_insumo_recipe_items_recipe_idx ON insumo_recipe_items(recipe_id, idx);
CREATE INDEX IF NOT EXISTS idx_insumo_recipe_items_name ON insumo_recipe_items USING gin(to_tsvector('portuguese', name));

-- Verificar índices criados
SELECT 'Índices criados com sucesso!' as status;