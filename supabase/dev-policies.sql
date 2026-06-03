-- Development-only policies.
-- Use this file only while DEV_MODE=true and login is temporarily disabled.
-- Remove these policies before production.

alter table public.customers enable row level security;
alter table public.service_history enable row level security;

drop policy if exists "Dev anon can read customers" on public.customers;
drop policy if exists "Dev anon can insert customers" on public.customers;
drop policy if exists "Dev anon can update customers" on public.customers;
drop policy if exists "Dev anon can delete customers" on public.customers;

create policy "Dev anon can read customers"
  on public.customers for select
  to anon
  using (true);

create policy "Dev anon can insert customers"
  on public.customers for insert
  to anon
  with check (true);

create policy "Dev anon can update customers"
  on public.customers for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete customers"
  on public.customers for delete
  to anon
  using (true);

drop policy if exists "Dev anon can read service history" on public.service_history;
drop policy if exists "Dev anon can insert service history" on public.service_history;
drop policy if exists "Dev anon can update service history" on public.service_history;
drop policy if exists "Dev anon can delete service history" on public.service_history;

create policy "Dev anon can read service history"
  on public.service_history for select
  to anon
  using (true);

create policy "Dev anon can insert service history"
  on public.service_history for insert
  to anon
  with check (true);

create policy "Dev anon can update service history"
  on public.service_history for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete service history"
  on public.service_history for delete
  to anon
  using (true);
