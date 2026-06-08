-- Run before production to remove development anon access.

drop policy if exists "Dev anon can read customers" on public.customers;
drop policy if exists "Dev anon can insert customers" on public.customers;
drop policy if exists "Dev anon can update customers" on public.customers;
drop policy if exists "Dev anon can delete customers" on public.customers;

drop policy if exists "Dev anon can read service history" on public.service_history;
drop policy if exists "Dev anon can insert service history" on public.service_history;
drop policy if exists "Dev anon can update service history" on public.service_history;
drop policy if exists "Dev anon can delete service history" on public.service_history;

drop policy if exists "Dev anon can read visit history" on public.visit_history;
drop policy if exists "Dev anon can insert visit history" on public.visit_history;
drop policy if exists "Dev anon can update visit history" on public.visit_history;
drop policy if exists "Dev anon can delete visit history" on public.visit_history;
