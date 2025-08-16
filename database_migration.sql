-- Migração para adicionar colunas unit e quantity à tabela insumo_recipe_items
-- Execute este script no seu banco Supabase

-- Adicionar coluna unit (unidade de medida)
ALTER TABLE insumo_recipe_items 
ADD COLUMN unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'ml', 'l', 'unidade'));

-- Adicionar coluna quantity (quantidade na receita)
ALTER TABLE insumo_recipe_items 
ADD COLUMN quantity DECIMAL(10,2) DEFAULT 1.0;

-- Comentários para documentação
COMMENT ON COLUMN insumo_recipe_items.unit IS 'Unidade de medida do insumo (kg, g, ml, l, unidade)';
COMMENT ON COLUMN insumo_recipe_items.quantity IS 'Quantidade utilizada na receita';

-- Atualizar registros existentes para ter valores padrão
UPDATE insumo_recipe_items 
SET unit = 'kg', quantity = 1.0 
WHERE unit IS NULL OR quantity IS NULL;