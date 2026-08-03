-- Fase R6 da migracao multi-salao (RLS real por salao)
-- Aplica isolamento por salao as policies de producao (role authenticated)
-- de public.before_after_history, reutilizando a funcao
-- public.current_user_salon_ids() ja criada na Fase R1
-- (0009_add_rls_isolation_to_customers.sql).
--
-- Nao cria nenhuma funcao nova. Nao altera nenhuma outra tabela, nenhuma
-- policy de "Dev anon" (supabase/dev-policies.sql), Storage, triggers,
-- Auth ou a aplicacao. O comportamento funcional da app nao muda: a
-- leitura (getBeforeAfterHistory em lib/data.ts) e a criacao
-- (createBeforeAfterHistory em lib/before-after-actions.ts) ja filtravam
-- sempre por salon_id resolvido no servidor — esta migracao apenas
-- adiciona a mesma regra tambem ao nivel da RLS. Update/delete nao tem
-- Server Action implementada hoje, mas as policies de producao ja
-- existiam para as 4 operacoes (supabase/before-after-history.sql), por
-- isso sao todas substituidas por coerencia.
--
-- NOTA: os nomes de policy desta tabela seguem a convencao definida em
-- supabase/before-after-history.sql ("Authenticated can <operacao>
-- before_after_history"), diferente da convencao "Authenticated users
-- can <operacao> <tabela>" usada em customers/appointments/professionals/
-- service_history/product_history (definida em supabase/schema.sql).
-- Usar os nomes exatos e obrigatorio para que o "drop policy if exists"
-- realmente apague a policy antiga antes do "create policy" recriar.

-- ============================================================
-- Policies de producao de public.before_after_history — substituir
-- using(true)/with check(true) por isolamento real via
-- current_user_salon_ids(). Apenas estas 4 policies (role authenticated)
-- sao substituidas; as policies "Dev anon" (role anon, em
-- dev-policies.sql) nao sao tocadas nesta fase.
-- ============================================================

drop policy if exists "Authenticated can select before_after_history" on public.before_after_history;
create policy "Authenticated can select before_after_history"
  on public.before_after_history
  for select
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated can insert before_after_history" on public.before_after_history;
create policy "Authenticated can insert before_after_history"
  on public.before_after_history
  for insert
  to authenticated
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated can update before_after_history" on public.before_after_history;
create policy "Authenticated can update before_after_history"
  on public.before_after_history
  for update
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()))
  with check (salon_id in (select public.current_user_salon_ids()));

drop policy if exists "Authenticated can delete before_after_history" on public.before_after_history;
create policy "Authenticated can delete before_after_history"
  on public.before_after_history
  for delete
  to authenticated
  using (salon_id in (select public.current_user_salon_ids()));

-- ============================================================
-- Verificacao atomica (na mesma transacao do "Run" do SQL Editor): apos
-- os 4 pares drop+create acima, confirma que existem exatamente 4
-- policies "authenticated" nesta tabela e que TODAS usam
-- current_user_salon_ids() — nenhuma ficou com using(true)/with
-- check(true) por execucao parcial. Se algo estiver errado, aborta com
-- excecao e reverte tudo (incluindo os drop+create acima), tal como o
-- padrao ja usado nas migracoes de backfill (0003-0008): nunca deixa a
-- tabela num estado inconsistente ou parcialmente aplicado.
-- ============================================================

do $$
declare
  v_authenticated_count integer;
  v_not_isolated_count integer;
begin
  select count(*) into v_authenticated_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'before_after_history'
    and roles = '{authenticated}';

  if v_authenticated_count <> 4 then
    raise exception
      'Esperava exatamente 4 policies "authenticated" em before_after_history, encontrei %. Fase R6 abortada — nenhuma alteracao foi mantida.',
      v_authenticated_count;
  end if;

  select count(*) into v_not_isolated_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'before_after_history'
    and roles = '{authenticated}'
    and (
      (qual is not null and qual not ilike '%current_user_salon_ids%')
      or (with_check is not null and with_check not ilike '%current_user_salon_ids%')
    );

  if v_not_isolated_count > 0 then
    raise exception
      'Existem % policy(ies) "authenticated" em before_after_history que ainda nao usam current_user_salon_ids(). Fase R6 abortada — nenhuma alteracao foi mantida.',
      v_not_isolated_count;
  end if;
end $$;

-- ============================================================
-- Consulta de verificacao (apenas leitura — correr manualmente no SQL
-- Editor depois da migracao acima ter sido aplicada com sucesso).
-- ============================================================

select
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public'
  and tablename = 'before_after_history'
order by cmd;
