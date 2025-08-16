-- =====================================================
-- POLÍTICAS RLS OTIMIZADAS
-- =====================================================

-- Política Otimizada para Camaradas
DROP POLICY IF EXISTS "Camaradas são visíveis para todos os usuários autenticados" ON camaradas;

CREATE POLICY "camaradas_select_policy" ON camaradas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "camaradas_insert_policy" ON camaradas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "camaradas_update_policy" ON camaradas
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "camaradas_delete_policy" ON camaradas
    FOR DELETE
    TO authenticated
    USING (true);

-- Política Otimizada para Institutos
DROP POLICY IF EXISTS "Institutos são visíveis para todos os usuários autenticados" ON institutos;

CREATE POLICY "institutos_select_policy" ON institutos
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "institutos_insert_policy" ON institutos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "institutos_update_policy" ON institutos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "institutos_delete_policy" ON institutos
    FOR DELETE
    TO authenticated
    USING (true);

-- Política Otimizada para CAs
DROP POLICY IF EXISTS "CAs são visíveis para todos os usuários autenticados" ON cas;

CREATE POLICY "cas_select_policy" ON cas
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "cas_insert_policy" ON cas
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "cas_update_policy" ON cas
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "cas_delete_policy" ON cas
    FOR DELETE
    TO authenticated
    USING (true);

-- Política Otimizada para Escala
DROP POLICY IF EXISTS "Escalas são visíveis para todos os usuários autenticados" ON escala;

CREATE POLICY "escala_select_policy" ON escala
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "escala_insert_policy" ON escala
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "escala_update_policy" ON escala
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "escala_delete_policy" ON escala
    FOR DELETE
    TO authenticated
    USING (true);

-- Política Otimizada para Produtos (insumo_recipes)
DROP POLICY IF EXISTS "Users can view their own recipes" ON insumo_recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON insumo_recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON insumo_recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON insumo_recipes;

CREATE POLICY "insumo_recipes_select_policy" ON insumo_recipes
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "insumo_recipes_insert_policy" ON insumo_recipes
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "insumo_recipes_update_policy" ON insumo_recipes
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "insumo_recipes_delete_policy" ON insumo_recipes
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Política Otimizada para Itens de Receita (insumo_recipe_items)
DROP POLICY IF EXISTS "Users can view their own recipe items" ON insumo_recipe_items;
DROP POLICY IF EXISTS "Users can insert their own recipe items" ON insumo_recipe_items;
DROP POLICY IF EXISTS "Users can update their own recipe items" ON insumo_recipe_items;
DROP POLICY IF EXISTS "Users can delete their own recipe items" ON insumo_recipe_items;

CREATE POLICY "insumo_recipe_items_select_policy" ON insumo_recipe_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM insumo_recipes r 
            WHERE r.id = recipe_id 
            AND (r.user_id = auth.uid() OR r.user_id IS NULL)
        )
    );

CREATE POLICY "insumo_recipe_items_insert_policy" ON insumo_recipe_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM insumo_recipes r 
            WHERE r.id = recipe_id 
            AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "insumo_recipe_items_update_policy" ON insumo_recipe_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM insumo_recipes r 
            WHERE r.id = recipe_id 
            AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM insumo_recipes r 
            WHERE r.id = recipe_id 
            AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "insumo_recipe_items_delete_policy" ON insumo_recipe_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM insumo_recipes r 
            WHERE r.id = recipe_id 
            AND r.user_id = auth.uid()
        )
    );

-- Verificar políticas criadas
SELECT 'Políticas RLS criadas com sucesso!' as status;