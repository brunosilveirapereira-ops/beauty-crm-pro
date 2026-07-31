-- Fase R1 da migracao multi-salao (piloto de RLS real por salao)
-- Cria a funcao reutilizavel public.current_user_salon_ids() e aplica-a
-- APENAS as policies de producao (role authenticated) de public.customers,
-- substituindo using(true)/with check(true) por isolamento real por salao.
--
-- Nao altera nenhuma outra tabela, nenhuma policy de "Dev anon"
-- (supabase/dev-policies.sql), Storage, triggers, Auth ou a aplicacao.
-- O comportamento funcional da app nao muda: os Server Actions e
-- lib/data.ts ja filtravam sempre por salon_id resolvido no servidor —
-- esta migracao apenas adiciona a mesma regra tambem ao nivel da RLS.

-- ============================================================
-- 1) Funcao reutilizavel: devolve os salon_id a que o utilizador
--    autenticado tem acesso, via salon_members (acesso direto a um
--    salao) ou company_members (acesso a todos os saloes da empresa).
--    Mesma logica de lib/salon.ts (getCurrentContext), agora tambem
--    disponivel dentro da RLS.
-- ============================================================

create or replace function public.current_user_salon_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select salon_id
  from public.salon_members
  where user_id = auth.uid()

  union

  select s.id
  from public.salons s
  join public.company_members cm on cm.company_id = s.company_id
  where cm.user_id = auth.uid();
$$;

revoke execute on function public.current_user_salon_ids() from public, anon;
grant execute on function public.current_user_salon_ids() to authenticated;

-- ============================================================
-- 2) Policies de producao de public.customers — substituir using(true)/
--    with check(true) por isolamento real via current_user_salon_ids().
--    Apenas estas 4 policies (role authenticated) sao substituidas; as
--    policies "Dev anon" (role anon, em dev-policies.sql) nao sao
--    tocadas nesta fase.
-- ============================================================

drop policy if exists "Authenticated users can read customers" on public.customers;
create policy "Authenticated users can read customers"
  on public.customers for select
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can insert customers" on public.customers;
create policy "Authenticated users can insert customers"
  on public.customers for insert
  to authenticated
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can update customers" on public.customers;
create policy "Authenticated users can update customers"
  on public.customers for update
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()))
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated users can delete customers" on public.customers;
create policy "Authenticated users can delete customers"
  on public.customers for delete
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));
