-- Fase 2 da migracao multi-salao (multi-tenant)
-- Cria a empresa inicial, o salao inicial, e associa o utilizador admin
-- existente a ambos. Nao cria nem altera nenhuma tabela de negocio,
-- nao toca em RLS, Storage, login, middleware ou na aplicacao.
--
-- Idempotente: pode ser executado varias vezes sem duplicar empresas,
-- saloes ou memberships (usa "on conflict" sobre as constraints unicas
-- criadas na Fase 1 — companies.slug, salons.slug,
-- company_members(user_id, company_id), salon_members(user_id, salon_id)).
--
-- O UUID do utilizador NUNCA e inventado: e sempre lido de auth.users
-- pelo email. Se o utilizador nao existir, a migracao aborta (raise
-- exception), sem criar empresa/salao "orfaos" sem dono.

do $$
declare
  v_admin_user_id uuid;
  v_company_id uuid;
  v_salon_id uuid;
begin
  select id into v_admin_user_id
  from auth.users
  where email = 'brunosilveirapereira@gmail.com'
  limit 1;

  if v_admin_user_id is null then
    raise exception
      'Utilizador admin com email brunosilveirapereira@gmail.com nao encontrado em auth.users. Fase 2 abortada — nenhuma alteracao foi feita.';
  end if;

  -- Empresa inicial (idempotente via unique em companies.slug)
  insert into public.companies (name, slug)
  values ('Beauty CRM Pro', 'beauty-crm-pro')
  on conflict (slug) do nothing;

  select id into v_company_id
  from public.companies
  where slug = 'beauty-crm-pro';

  -- Salao inicial, ligado a empresa acima (idempotente via unique em salons.slug)
  insert into public.salons (company_id, name, slug)
  values (v_company_id, 'Salão Principal', 'salao-principal')
  on conflict (slug) do nothing;

  select id into v_salon_id
  from public.salons
  where slug = 'salao-principal';

  -- Admin como membro da empresa, com a funcao mais alta permitida pelo
  -- schema atual (company_members.role aceita 'owner' ou 'admin' —
  -- ver check constraint criada em 0001_multi_tenant_base_tables.sql).
  insert into public.company_members (user_id, company_id, role)
  values (v_admin_user_id, v_company_id, 'owner')
  on conflict (user_id, company_id) do nothing;

  -- Admin como membro do salao, com a funcao mais alta permitida pelo
  -- schema atual (salon_members.role aceita apenas 'manager' ou 'staff' —
  -- nao existe 'owner'/'admin' nessa tabela; 'manager' e o equivalente de
  -- topo aqui. Ver secao "verificacoes e riscos" da resposta desta fase).
  insert into public.salon_members (user_id, salon_id, role)
  values (v_admin_user_id, v_salon_id, 'manager')
  on conflict (user_id, salon_id) do nothing;
end $$;
