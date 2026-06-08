create extension if not exists "pgcrypto";

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  instagram text,
  birth_date date,
  last_visit date,
  last_visit_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists last_visit_date date;

update public.customers
set last_visit_date = coalesce(last_visit_date, last_visit)
where last_visit is not null;

create table if not exists public.service_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  date date not null,
  service text not null,
  professional text,
  value numeric(10, 2) not null default 0,
  formula_products text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visit_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.service_history(id) on delete set null,
  service_name text not null,
  professional_name text,
  visit_date date not null,
  value numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists customers_last_visit_idx on public.customers(last_visit);
create index if not exists customers_last_visit_date_idx on public.customers(last_visit_date);
create index if not exists customers_birth_date_idx on public.customers(birth_date);
create index if not exists customers_created_at_idx on public.customers(created_at);
create index if not exists service_history_date_idx on public.service_history(date);
create index if not exists service_history_customer_id_idx on public.service_history(customer_id);
create index if not exists visit_history_customer_id_idx on public.visit_history(customer_id);
create index if not exists visit_history_visit_date_idx on public.visit_history(visit_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists service_history_set_updated_at on public.service_history;
create trigger service_history_set_updated_at
before update on public.service_history
for each row
execute function public.set_updated_at();

create or replace function public.sync_customer_last_visit()
returns trigger
language plpgsql
as $$
begin
  update public.customers
  set
    last_visit = greatest(coalesce(last_visit, new.date), new.date),
    last_visit_date = greatest(coalesce(last_visit_date, new.date), new.date)
  where id = new.customer_id;

  return new;
end;
$$;

drop trigger if exists service_history_sync_customer_last_visit on public.service_history;
create trigger service_history_sync_customer_last_visit
after insert or update of date, customer_id on public.service_history
for each row
execute function public.sync_customer_last_visit();

create or replace function public.sync_customer_last_visit_from_visit_history()
returns trigger
language plpgsql
as $$
begin
  update public.customers
  set
    last_visit = greatest(coalesce(last_visit, new.visit_date), new.visit_date),
    last_visit_date = greatest(coalesce(last_visit_date, new.visit_date), new.visit_date)
  where id = new.customer_id;

  return new;
end;
$$;

drop trigger if exists visit_history_sync_customer_last_visit on public.visit_history;
create trigger visit_history_sync_customer_last_visit
after insert or update of visit_date, customer_id on public.visit_history
for each row
execute function public.sync_customer_last_visit_from_visit_history();

alter table public.customers enable row level security;
alter table public.service_history enable row level security;
alter table public.visit_history enable row level security;

drop policy if exists "Authenticated users can read customers" on public.customers;
drop policy if exists "Authenticated users can insert customers" on public.customers;
drop policy if exists "Authenticated users can update customers" on public.customers;
drop policy if exists "Authenticated users can delete customers" on public.customers;

create policy "Authenticated users can read customers"
  on public.customers for select
  to authenticated
  using (true);

create policy "Authenticated users can insert customers"
  on public.customers for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update customers"
  on public.customers for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete customers"
  on public.customers for delete
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read service history" on public.service_history;
drop policy if exists "Authenticated users can insert service history" on public.service_history;
drop policy if exists "Authenticated users can update service history" on public.service_history;
drop policy if exists "Authenticated users can delete service history" on public.service_history;

create policy "Authenticated users can read service history"
  on public.service_history for select
  to authenticated
  using (true);

create policy "Authenticated users can insert service history"
  on public.service_history for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update service history"
  on public.service_history for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete service history"
  on public.service_history for delete
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read visit history" on public.visit_history;
drop policy if exists "Authenticated users can insert visit history" on public.visit_history;
drop policy if exists "Authenticated users can update visit history" on public.visit_history;
drop policy if exists "Authenticated users can delete visit history" on public.visit_history;

create policy "Authenticated users can read visit history"
  on public.visit_history for select
  to authenticated
  using (true);

create policy "Authenticated users can insert visit history"
  on public.visit_history for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update visit history"
  on public.visit_history for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete visit history"
  on public.visit_history for delete
  to authenticated
  using (true);

insert into public.customers (name, phone, whatsapp, instagram, birth_date, last_visit, notes)
select 'Mariana Costa', '+351 910 000 112', '+351910000112', '@maricosta', '1991-06-18'::date, '2026-05-20'::date, 'Prefere tons frios e atendimento no fim do dia.'
where not exists (select 1 from public.customers where whatsapp = '+351910000112');

insert into public.customers (name, phone, whatsapp, instagram, birth_date, last_visit, notes)
select 'Sofia Almeida', '+351 920 441 223', '+351920441223', '@sofiaalmeida', '1987-06-04'::date, '2026-02-08'::date, 'Cliente de coloracao, sensivel a produtos com amonia.'
where not exists (select 1 from public.customers where whatsapp = '+351920441223');

insert into public.customers (name, phone, whatsapp, instagram, birth_date, last_visit, notes)
select 'Beatriz Rocha', '+351 930 118 442', '+351930118442', '@bia.rocha', '1994-11-27'::date, '2026-03-18'::date, 'Gosta de lembretes por WhatsApp.'
where not exists (select 1 from public.customers where whatsapp = '+351930118442');

insert into public.service_history (customer_id, date, service, professional, value, formula_products, notes)
select id, '2026-05-20', 'Corte + brushing', 'Ines', 48, 'Shampoo hidratante, protetor termico', 'Manter comprimento abaixo do ombro.'
from public.customers
where name = 'Mariana Costa'
and not exists (
  select 1 from public.service_history
  where customer_id = public.customers.id and date = '2026-05-20' and service = 'Corte + brushing'
);

insert into public.service_history (customer_id, date, service, professional, value, formula_products, notes)
select id, '2026-02-08', 'Coloracao raiz', 'Clara', 82, '6.1 + oxidante 20 vol', 'Reavaliar brilho no proximo retorno.'
from public.customers
where name = 'Sofia Almeida'
and not exists (
  select 1 from public.service_history
  where customer_id = public.customers.id and date = '2026-02-08' and service = 'Coloracao raiz'
);

insert into public.service_history (customer_id, date, service, professional, value, formula_products, notes)
select id, '2026-03-18', 'Manicure gel', 'Marta', 32, 'Base niveladora, top coat', 'Preferencia por nude rosado.'
from public.customers
where name = 'Beatriz Rocha'
and not exists (
  select 1 from public.service_history
  where customer_id = public.customers.id and date = '2026-03-18' and service = 'Manicure gel'
);
