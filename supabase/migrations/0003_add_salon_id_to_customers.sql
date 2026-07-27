-- Fase 3 da migracao multi-salao (multi-tenant)
-- Adiciona salon_id a public.customers e associa todos os clientes
-- existentes ao "Salao Principal" criado na Fase 2
-- (0002_create_initial_company_and_salon.sql, slug = 'salao-principal').
--
-- Nao toca em RLS, policies, Storage, login, middleware, agenda,
-- profissionais ou qualquer outra tabela de negocio. Nao apaga nem
-- altera nenhum dado existente dos clientes — apenas preenche a nova
-- coluna.
--
-- Ordem desenhada para nunca deixar a tabela num estado invalido:
-- 1) coluna nullable -> 2) FK -> 3) backfill + verificacao -> 4) NOT NULL -> 5) indice.

-- ============================================================
-- 1) Adicionar a coluna, permitindo NULL, para nao rebentar com as
--    linhas ja existentes de public.customers.
-- ============================================================

alter table public.customers
  add column if not exists salon_id uuid;

-- ============================================================
-- 2) Referenciar public.salons(id) (uuid). "on delete restrict" impede
--    que um salao seja apagado enquanto ainda tiver clientes associados
--    (protege contra perda acidental de dados de negocio).
-- ============================================================

alter table public.customers
  drop constraint if exists customers_salon_id_fkey;

alter table public.customers
  add constraint customers_salon_id_fkey
  foreign key (salon_id) references public.salons(id) on delete restrict;

-- ============================================================
-- 3) Localizar o "Salao Principal" pelo slug (identificador estavel e
--    unico, criado na Fase 2 — mais seguro do que localizar pelo nome,
--    que nao tem constraint de unicidade) e associar todos os clientes
--    que ainda nao tenham salon_id preenchido.
--    Aborta com excecao se o salao nao existir, ou se sobrar algum
--    cliente sem salon_id depois do backfill — nunca avanca para o
--    NOT NULL num estado inconsistente.
-- ============================================================

do $$
declare
  v_salon_id uuid;
  v_remaining_null_count integer;
begin
  select id into v_salon_id
  from public.salons
  where slug = 'salao-principal';

  if v_salon_id is null then
    raise exception
      'Salao "Salao Principal" (slug = salao-principal) nao encontrado. Fase 3 abortada — nenhum cliente foi alterado.';
  end if;

  update public.customers
  set salon_id = v_salon_id
  where salon_id is null;

  select count(*) into v_remaining_null_count
  from public.customers
  where salon_id is null;

  if v_remaining_null_count > 0 then
    raise exception
      'Ainda existem % cliente(s) com salon_id NULL apos o backfill. Fase 3 abortada antes de aplicar NOT NULL.',
      v_remaining_null_count;
  end if;
end $$;

-- ============================================================
-- 4) Só agora, com o backfill confirmado (passo 3 nunca chega aqui se
--    sobrar algum NULL), tornar a coluna obrigatoria.
-- ============================================================

alter table public.customers
  alter column salon_id set not null;

-- ============================================================
-- 5) Indice para as consultas/policies futuras que vao filtrar por
--    salon_id (desempenho a escala de milhares de saloes).
-- ============================================================

create index if not exists customers_salon_id_idx on public.customers(salon_id);
