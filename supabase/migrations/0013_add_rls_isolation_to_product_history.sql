-- Fase R5 da migracao multi-salao (RLS real por salao)
-- Aplica isolamento por salao as policies de producao (role authenticated)
-- de public.product_history, reutilizando a funcao
-- public.current_user_salon_ids() ja criada na Fase R1
-- (0009_add_rls_isolation_to_customers.sql).
--
-- Nao cria nenhuma funcao nova. Nao altera nenhuma outra tabela, nenhuma
-- policy de "Dev anon" (supabase/dev-policies.sql), Storage, triggers,
-- Auth ou a aplicacao. O comportamento funcional da app nao muda: a
-- leitura (getProductHistory em lib/data.ts) e a criacao
-- (createProductHistory em lib/product-history-actions.ts) ja filtravam
-- sempre por salon_id resolvido no servidor — esta migracao apenas
-- adiciona a mesma regra tambem ao nivel da RLS. Update/delete nao tem
-- Server Action implementada hoje, mas as policies de producao ja
-- existiam para as 4 operacoes (schema.sql), por isso sao todas
-- substituidas por coerencia.

-- ============================================================
-- Policies de producao de public.product_history — substituir
-- using(true)/with check(true) por isolamento real via
-- current_user_salon_ids(). Apenas estas 4 policies (role authenticated)
-- sao substituidas; as policies "Dev anon" (role anon, em
-- dev-policies.sql) nao sao tocadas nesta fase.
-- ============================================================

drop policy if exists "Authenticated users can read product history" on public.product_history;
create policy "Authenticated users can read product history"
  on public.product_history for select
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can insert product history" on public.product_history;
create policy "Authenticated users can insert product history"
  on public.product_history for insert
  to authenticated
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can update product history" on public.product_history;
create policy "Authenticated users can update product history"
  on public.product_history for update
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()))
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can delete product history" on public.product_history;
create policy "Authenticated users can delete product history"
  on public.product_history for delete
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));
