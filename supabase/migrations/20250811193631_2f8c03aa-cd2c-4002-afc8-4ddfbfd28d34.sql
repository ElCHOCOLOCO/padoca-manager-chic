-- Tables for product recipes and their 14 items
create table public.insumo_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  units_per_batch integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.insumo_recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.insumo_recipes(id) on delete cascade,
  idx smallint not null,
  name text not null default '',
  cost numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint insumo_recipe_items_idx_chk check (idx between 1 and 14),
  constraint insumo_recipe_items_unique_idx unique (recipe_id, idx)
);

-- Triggers for updated_at (function already exists in this project)
create trigger trg_insumo_recipes_updated
before update on public.insumo_recipes
for each row execute function public.update_updated_at_column();

create trigger trg_insumo_recipe_items_updated
before update on public.insumo_recipe_items
for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.insumo_recipes enable row level security;
alter table public.insumo_recipe_items enable row level security;

-- Policies: users can CRUD only their own recipes
create policy insumo_recipes_select_own on public.insumo_recipes
for select using (auth.uid() = user_id);

create policy insumo_recipes_insert_own on public.insumo_recipes
for insert with check (auth.uid() = user_id);

create policy insumo_recipes_update_own on public.insumo_recipes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy insumo_recipes_delete_own on public.insumo_recipes
for delete using (auth.uid() = user_id);

-- Policies for items: only through own recipes
create policy insumo_items_select_own on public.insumo_recipe_items
for select using (exists (
  select 1 from public.insumo_recipes r where r.id = recipe_id and r.user_id = auth.uid()
));

create policy insumo_items_insert_own on public.insumo_recipe_items
for insert with check (exists (
  select 1 from public.insumo_recipes r where r.id = recipe_id and r.user_id = auth.uid()
));

create policy insumo_items_update_own on public.insumo_recipe_items
for update using (exists (
  select 1 from public.insumo_recipes r where r.id = recipe_id and r.user_id = auth.uid()
)) with check (exists (
  select 1 from public.insumo_recipes r where r.id = recipe_id and r.user_id = auth.uid()
));

create policy insumo_items_delete_own on public.insumo_recipe_items
for delete using (exists (
  select 1 from public.insumo_recipes r where r.id = recipe_id and r.user_id = auth.uid()
));