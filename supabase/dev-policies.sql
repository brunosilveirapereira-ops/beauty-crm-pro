-- Development-only policies.
-- Use this file only while DEV_MODE=true and login is temporarily disabled.
-- Remove these policies before production.

alter table public.customers enable row level security;
alter table public.professionals enable row level security;
alter table public.service_history enable row level security;
alter table public.visit_history enable row level security;
alter table public.color_history enable row level security;
alter table public.product_history enable row level security;
alter table public.appointments enable row level security;

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

drop policy if exists "Dev anon can read professionals" on public.professionals;
drop policy if exists "Dev anon can insert professionals" on public.professionals;
drop policy if exists "Dev anon can update professionals" on public.professionals;
drop policy if exists "Dev anon can delete professionals" on public.professionals;

create policy "Dev anon can read professionals"
  on public.professionals for select
  to anon
  using (true);

create policy "Dev anon can insert professionals"
  on public.professionals for insert
  to anon
  with check (true);

create policy "Dev anon can update professionals"
  on public.professionals for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete professionals"
  on public.professionals for delete
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

drop policy if exists "Dev anon can read visit history" on public.visit_history;
drop policy if exists "Dev anon can insert visit history" on public.visit_history;
drop policy if exists "Dev anon can update visit history" on public.visit_history;
drop policy if exists "Dev anon can delete visit history" on public.visit_history;

create policy "Dev anon can read visit history"
  on public.visit_history for select
  to anon
  using (true);

create policy "Dev anon can insert visit history"
  on public.visit_history for insert
  to anon
  with check (true);

create policy "Dev anon can update visit history"
  on public.visit_history for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete visit history"
  on public.visit_history for delete
  to anon
  using (true);

drop policy if exists "Dev anon can read color history" on public.color_history;
drop policy if exists "Dev anon can insert color history" on public.color_history;
drop policy if exists "Dev anon can update color history" on public.color_history;
drop policy if exists "Dev anon can delete color history" on public.color_history;

create policy "Dev anon can read color history"
  on public.color_history for select
  to anon
  using (true);

create policy "Dev anon can insert color history"
  on public.color_history for insert
  to anon
  with check (true);

create policy "Dev anon can update color history"
  on public.color_history for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete color history"
  on public.color_history for delete
  to anon
  using (true);

drop policy if exists "Dev anon can read product history" on public.product_history;
drop policy if exists "Dev anon can insert product history" on public.product_history;
drop policy if exists "Dev anon can update product history" on public.product_history;
drop policy if exists "Dev anon can delete product history" on public.product_history;

create policy "Dev anon can read product history"
  on public.product_history for select
  to anon
  using (true);

create policy "Dev anon can insert product history"
  on public.product_history for insert
  to anon
  with check (true);

create policy "Dev anon can update product history"
  on public.product_history for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete product history"
  on public.product_history for delete
  to anon
  using (true);

drop policy if exists "Dev anon can read appointments" on public.appointments;
drop policy if exists "Dev anon can insert appointments" on public.appointments;
drop policy if exists "Dev anon can update appointments" on public.appointments;
drop policy if exists "Dev anon can delete appointments" on public.appointments;

create policy "Dev anon can read appointments"
  on public.appointments for select
  to anon
  using (true);

create policy "Dev anon can insert appointments"
  on public.appointments for insert
  to anon
  with check (true);

create policy "Dev anon can update appointments"
  on public.appointments for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete appointments"
  on public.appointments for delete
  to anon
  using (true);

alter table public.before_after_history enable row level security;

drop policy if exists "Dev anon can read before_after_history"   on public.before_after_history;
drop policy if exists "Dev anon can insert before_after_history"  on public.before_after_history;
drop policy if exists "Dev anon can update before_after_history"  on public.before_after_history;
drop policy if exists "Dev anon can delete before_after_history"  on public.before_after_history;

create policy "Dev anon can read before_after_history"
  on public.before_after_history for select
  to anon
  using (true);

create policy "Dev anon can insert before_after_history"
  on public.before_after_history for insert
  to anon
  with check (true);

create policy "Dev anon can update before_after_history"
  on public.before_after_history for update
  to anon
  using (true)
  with check (true);

create policy "Dev anon can delete before_after_history"
  on public.before_after_history for delete
  to anon
  using (true);

-- Dev mode: Storage — bucket customer-transformations
drop policy if exists "Dev anon can upload transformations"  on storage.objects;
drop policy if exists "Dev anon can view transformations"    on storage.objects;

create policy "Dev anon can upload transformations"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'customer-transformations');

create policy "Dev anon can view transformations"
  on storage.objects for select
  to anon
  using (bucket_id = 'customer-transformations');
