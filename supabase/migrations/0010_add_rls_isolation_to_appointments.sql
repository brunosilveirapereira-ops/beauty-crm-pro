-- Fase R2 da migracao multi-salao (RLS real por salao)
-- Aplica isolamento por salao as policies de producao (role authenticated)
-- de public.appointments, reutilizando a funcao public.current_user_salon_ids()
-- ja criada na Fase R1 (0009_add_rls_isolation_to_customers.sql).
--
-- Nao cria nenhuma funcao nova. Nao altera nenhuma outra tabela, nenhuma
-- policy de "Dev anon" (supabase/dev-policies.sql), Storage, triggers,
-- Auth ou a aplicacao. O comportamento funcional da app nao muda: os
-- Server Actions de agenda (lib/appointment-actions.ts) ja filtravam
-- sempre por salon_id resolvido no servidor — esta migracao apenas
-- adiciona a mesma regra tambem ao nivel da RLS.

-- ============================================================
-- Policies de producao de public.appointments — substituir using(true)/
-- with check(true) por isolamento real via current_user_salon_ids().
-- Apenas estas 4 policies (role authenticated) sao substituidas; as
-- policies "Dev anon" (role anon, em dev-policies.sql) nao sao tocadas
-- nesta fase.
-- ============================================================

drop policy if exists "Authenticated users can read appointments" on public.appointments;
create policy "Authenticated users can read appointments"
  on public.appointments for select
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can insert appointments" on public.appointments;
create policy "Authenticated users can insert appointments"
  on public.appointments for insert
  to authenticated
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can update appointments" on public.appointments;
create policy "Authenticated users can update appointments"
  on public.appointments for update
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()))
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can delete appointments" on public.appointments;
create policy "Authenticated users can delete appointments"
  on public.appointments for delete
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));
