create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABELA
-- ------------------------------------------------------------

create table if not exists public.before_after_history (
  id               uuid        primary key default gen_random_uuid(),
  customer_id      uuid        not null references public.customers(id) on delete cascade,
  date             date        not null,
  service          text        not null,
  before_image_url text        not null,
  after_image_url  text        not null,
  observations     text,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

create index if not exists before_after_history_customer_id_idx
  on public.before_after_history (customer_id);

create index if not exists before_after_history_date_idx
  on public.before_after_history (date desc);

-- ------------------------------------------------------------
-- RLS — activar
-- ------------------------------------------------------------

alter table public.before_after_history enable row level security;

-- ------------------------------------------------------------
-- RLS — políticas PRODUÇÃO (authenticated)
-- ------------------------------------------------------------

drop policy if exists "Authenticated can select before_after_history" on public.before_after_history;
drop policy if exists "Authenticated can insert before_after_history" on public.before_after_history;
drop policy if exists "Authenticated can update before_after_history" on public.before_after_history;
drop policy if exists "Authenticated can delete before_after_history" on public.before_after_history;

create policy "Authenticated can select before_after_history"
  on public.before_after_history
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert before_after_history"
  on public.before_after_history
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update before_after_history"
  on public.before_after_history
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete before_after_history"
  on public.before_after_history
  for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- RLS — políticas DEV (anon)
-- Usar apenas com DEV_MODE=true. Remover em produção.
-- ------------------------------------------------------------

drop policy if exists "Dev anon can select before_after_history" on public.before_after_history;
drop policy if exists "Dev anon can insert before_after_history" on public.before_after_history;
drop policy if exists "Dev anon can update before_after_history" on public.before_after_history;
drop policy if exists "Dev anon can delete before_after_history" on public.before_after_history;

create policy "Dev anon can select before_after_history"
  on public.before_after_history
  for select
  to anon
  using (true);

create policy "Dev anon can insert before_after_history"
  on public.before_after_history
  for insert
  to anon
  with check (true);

create policy "Dev anon can update before_after_history"
  on public.before_after_history
  for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete before_after_history"
  on public.before_after_history
  for delete
  to anon
  using (true);

-- ------------------------------------------------------------
-- STORAGE — bucket
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-transformations',
  'customer-transformations',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- STORAGE — políticas em storage.objects (authenticated)
-- ------------------------------------------------------------

drop policy if exists "Authenticated can upload to customer-transformations"  on storage.objects;
drop policy if exists "Authenticated can read customer-transformations"        on storage.objects;
drop policy if exists "Authenticated can delete customer-transformations"      on storage.objects;

create policy "Authenticated can upload to customer-transformations"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'customer-transformations');

create policy "Authenticated can read customer-transformations"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'customer-transformations');

create policy "Authenticated can delete customer-transformations"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'customer-transformations');

-- ------------------------------------------------------------
-- STORAGE — políticas em storage.objects (anon / DEV_MODE)
-- Usar apenas com DEV_MODE=true. Remover em produção.
-- ------------------------------------------------------------

drop policy if exists "Anon can read customer-transformations"   on storage.objects;
drop policy if exists "Anon can upload customer-transformations" on storage.objects;

create policy "Anon can read customer-transformations"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'customer-transformations');

create policy "Anon can upload customer-transformations"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'customer-transformations');
