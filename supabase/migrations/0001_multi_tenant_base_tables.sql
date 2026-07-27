-- Fase 1 da migracao multi-salao (multi-tenant)
-- Cria APENAS a estrutura base: companies, salons, company_members, salon_members.
-- Nao altera nenhuma tabela existente, nenhuma policy existente, nem Storage.
-- Nenhuma linha e inserida nesta fase (seed do salao inicial fica para a Fase 2).
-- Depende da funcao public.set_updated_at(), ja criada em supabase/schema.sql.

create extension if not exists "pgcrypto";

-- ============================================================
-- companies — entidade "empresa" (agrupa 1+ saloes)
-- ============================================================

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

-- ============================================================
-- salons — entidade "salao" (tenant operacional, pertence a uma company)
-- ============================================================

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salons_company_id_idx on public.salons(company_id);

drop trigger if exists salons_set_updated_at on public.salons;
create trigger salons_set_updated_at
before update on public.salons
for each row
execute function public.set_updated_at();

-- ============================================================
-- company_members — utilizador com acesso a TODOS os saloes de uma company
-- ============================================================

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create index if not exists company_members_user_id_idx on public.company_members(user_id);
create index if not exists company_members_company_id_idx on public.company_members(company_id);

-- ============================================================
-- salon_members — utilizador com acesso restrito a UM salao
-- ============================================================

create table if not exists public.salon_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  role text not null default 'manager' check (role in ('manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (user_id, salon_id)
);

create index if not exists salon_members_user_id_idx on public.salon_members(user_id);
create index if not exists salon_members_salon_id_idx on public.salon_members(salon_id);

-- ============================================================
-- RLS — apenas nas 4 tabelas novas. Nenhuma policy existente e tocada.
-- ============================================================

alter table public.companies enable row level security;
alter table public.salons enable row level security;
alter table public.company_members enable row level security;
alter table public.salon_members enable row level security;

-- companies: um utilizador ve as companies onde e membro. Sem insert/update/delete via cliente.
drop policy if exists "Members can read their companies" on public.companies;
create policy "Members can read their companies"
  on public.companies for select
  to authenticated
  using (
    id in (select company_id from public.company_members where user_id = auth.uid())
  );

-- salons: um utilizador ve saloes onde e membro direto OU saloes da company onde e membro.
-- Sem insert/update/delete via cliente.
drop policy if exists "Members can read their salons" on public.salons;
create policy "Members can read their salons"
  on public.salons for select
  to authenticated
  using (
    id in (select salon_id from public.salon_members where user_id = auth.uid())
    or company_id in (select company_id from public.company_members where user_id = auth.uid())
  );

-- company_members: um utilizador so ve as suas proprias linhas. Sem insert/update/delete via cliente
-- (gestao de membros e sempre server-side/admin).
drop policy if exists "Users can read their own company membership" on public.company_members;
create policy "Users can read their own company membership"
  on public.company_members for select
  to authenticated
  using (user_id = auth.uid());

-- salon_members: idem, restrito a UM salao.
drop policy if exists "Users can read their own salon membership" on public.salon_members;
create policy "Users can read their own salon membership"
  on public.salon_members for select
  to authenticated
  using (user_id = auth.uid());
