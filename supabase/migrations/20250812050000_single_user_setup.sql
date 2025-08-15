-- Single-user defaults and minimal schema to support Index.tsx
-- Safe UUID/text constants
-- default user and institute
create table if not exists public.institutos (
	id text primary key,
	nome text not null
);

create table if not exists public.camaradas (
	id uuid primary key default gen_random_uuid(),
	nome text not null,
	curso text not null default '',
	turnos text[] not null default '{}'
);

create table if not exists public.escala (
	id uuid primary key default gen_random_uuid(),
	camarada_id uuid not null references public.camaradas(id) on delete cascade,
	instituto_id text not null references public.institutos(id) on delete cascade,
	dia text,
	turno text not null
);

create table if not exists public.insumos (
	id uuid primary key default gen_random_uuid(),
	nome text not null,
	custo_unitario numeric not null default 0
);

create table if not exists public.custos_fixos (
	id uuid primary key default gen_random_uuid(),
	nome text not null,
	valor_mensal numeric not null default 0
);

create table if not exists public.vendas_diarias (
	id uuid primary key default gen_random_uuid(),
	data date not null,
	unidades integer not null default 0,
	preco_unitario numeric not null default 0
);

create table if not exists public.cas (
	id uuid primary key default gen_random_uuid(),
	nome text not null,
	status text not null default 'neutro',
	relacao text not null default '',
	humor text not null default '',
	desafios text not null default '',
	oportunidades text not null default ''
);

create table if not exists public.agenda (
	id uuid primary key default gen_random_uuid(),
	data date not null,
	titulo text not null,
	notas text
);

-- Seed default institute if missing
insert into public.institutos (id, nome)
select 'default', 'Instituto Padrão'
where not exists (select 1 from public.institutos where id = 'default');

-- Enable RLS and permissive policies for single-user where applicable
alter table public.institutos enable row level security;
alter table public.camaradas enable row level security;
alter table public.escala enable row level security;
alter table public.insumos enable row level security;
alter table public.custos_fixos enable row level security;
alter table public.vendas_diarias enable row level security;
alter table public.cas enable row level security;
alter table public.agenda enable row level security;

create policy if not exists p_all_select on public.institutos for select using (true);
create policy if not exists p_all_insert on public.institutos for insert with check (true);
create policy if not exists p_all_update on public.institutos for update using (true) with check (true);
create policy if not exists p_all_delete on public.institutos for delete using (true);

create policy if not exists p_camaradas_all_select on public.camaradas for select using (true);
create policy if not exists p_camaradas_all_insert on public.camaradas for insert with check (true);
create policy if not exists p_camaradas_all_update on public.camaradas for update using (true) with check (true);
create policy if not exists p_camaradas_all_delete on public.camaradas for delete using (true);

create policy if not exists p_escala_all_select on public.escala for select using (true);
create policy if not exists p_escala_all_insert on public.escala for insert with check (true);
create policy if not exists p_escala_all_update on public.escala for update using (true) with check (true);
create policy if not exists p_escala_all_delete on public.escala for delete using (true);

create policy if not exists p_insumos_all_select on public.insumos for select using (true);
create policy if not exists p_insumos_all_insert on public.insumos for insert with check (true);
create policy if not exists p_insumos_all_update on public.insumos for update using (true) with check (true);
create policy if not exists p_insumos_all_delete on public.insumos for delete using (true);

create policy if not exists p_cf_all_select on public.custos_fixos for select using (true);
create policy if not exists p_cf_all_insert on public.custos_fixos for insert with check (true);
create policy if not exists p_cf_all_update on public.custos_fixos for update using (true) with check (true);
create policy if not exists p_cf_all_delete on public.custos_fixos for delete using (true);

create policy if not exists p_vd_all_select on public.vendas_diarias for select using (true);
create policy if not exists p_vd_all_insert on public.vendas_diarias for insert with check (true);
create policy if not exists p_vd_all_update on public.vendas_diarias for update using (true) with check (true);
create policy if not exists p_vd_all_delete on public.vendas_diarias for delete using (true);

create policy if not exists p_cas_all_select on public.cas for select using (true);
create policy if not exists p_cas_all_insert on public.cas for insert with check (true);
create policy if not exists p_cas_all_update on public.cas for update using (true) with check (true);
create policy if not exists p_cas_all_delete on public.cas for delete using (true);

create policy if not exists p_agenda_all_select on public.agenda for select using (true);
create policy if not exists p_agenda_all_insert on public.agenda for insert with check (true);
create policy if not exists p_agenda_all_update on public.agenda for update using (true) with check (true);
create policy if not exists p_agenda_all_delete on public.agenda for delete using (true);