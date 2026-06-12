-- Run before production to remove development anon access.

drop policy if exists "Dev anon can read customers" on public.customers;
drop policy if exists "Dev anon can insert customers" on public.customers;
drop policy if exists "Dev anon can update customers" on public.customers;
drop policy if exists "Dev anon can delete customers" on public.customers;

drop policy if exists "Dev anon can read professionals" on public.professionals;
drop policy if exists "Dev anon can insert professionals" on public.professionals;
drop policy if exists "Dev anon can update professionals" on public.professionals;
drop policy if exists "Dev anon can delete professionals" on public.professionals;

drop policy if exists "Dev anon can read service history" on public.service_history;
drop policy if exists "Dev anon can insert service history" on public.service_history;
drop policy if exists "Dev anon can update service history" on public.service_history;
drop policy if exists "Dev anon can delete service history" on public.service_history;

drop policy if exists "Dev anon can read visit history" on public.visit_history;
drop policy if exists "Dev anon can insert visit history" on public.visit_history;
drop policy if exists "Dev anon can update visit history" on public.visit_history;
drop policy if exists "Dev anon can delete visit history" on public.visit_history;

drop policy if exists "Dev anon can read color history" on public.color_history;
drop policy if exists "Dev anon can insert color history" on public.color_history;
drop policy if exists "Dev anon can update color history" on public.color_history;
drop policy if exists "Dev anon can delete color history" on public.color_history;

drop policy if exists "Dev anon can read product history" on public.product_history;
drop policy if exists "Dev anon can insert product history" on public.product_history;
drop policy if exists "Dev anon can update product history" on public.product_history;
drop policy if exists "Dev anon can delete product history" on public.product_history;

drop policy if exists "Dev anon can read appointments" on public.appointments;
drop policy if exists "Dev anon can insert appointments" on public.appointments;
drop policy if exists "Dev anon can update appointments" on public.appointments;
drop policy if exists "Dev anon can delete appointments" on public.appointments;
