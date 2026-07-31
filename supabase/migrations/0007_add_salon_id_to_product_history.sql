-- Fase P1 da migracao multi-salao do modulo Historico de Produtos
-- Adiciona salon_id a public.product_history e associa todos os registos
-- existentes ao "Salao Principal" criado na Fase 2
-- (0002_create_initial_company_and_salon.sql, slug = 'salao-principal').
--
-- Nao toca em RLS, policies, Storage, login, middleware, triggers,
-- leitura, criacao, componentes ou qualquer outra tabela de negocio. Nao
-- apaga nem altera nenhum dado existente do historico de produtos —
-- apenas preenche a nova coluna.
--
-- Ordem desenhada para nunca deixar a tabela num estado invalido:
-- 1) coluna nullable -> 2) FK -> 3) backfill + verificacao -> 4) NOT NULL -> 5) indice.

-- ============================================================
-- 1) Adicionar a coluna, permitindo NULL, para nao rebentar com as
--    linhas ja existentes de public.product_history.
-- ============================================================

alter table public.product_history
  add column if not exists salon_id uuid;

-- ============================================================
-- 2) Referenciar public.salons(id) (uuid). "on delete restrict" impede
--    que um salao seja apagado enquanto ainda tiver historico de produtos
--    associado (protege contra perda acidental de dados de negocio) —
--    mesma convencao usada em 0003, 0004, 0005 e 0006.
-- ============================================================

alter table public.product_history
  drop constraint if exists product_history_salon_id_fkey;

alter table public.product_history
  add constraint product_history_salon_id_fkey
  foreign key (salon_id) references public.salons(id) on delete restrict;

-- ============================================================
-- 3) Localizar o "Salao Principal" pelo slug (identificador estavel e
--    unico, criado na Fase 2 — nao usamos um UUID fixo/hardcoded; o salao
--    e sempre resolvido a partir de dados ja existentes na base de dados)
--    e associar todos os registos de historico de produtos que ainda nao
--    tenham salon_id preenchido.
--    Aborta com excecao se o salao nao existir, ou se sobrar algum
--    registo sem salon_id depois do backfill — nunca avanca para o
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
      'Salao "Salao Principal" (slug = salao-principal) nao encontrado. Fase P1 abortada — nenhum registo foi alterado.';
  end if;

  update public.product_history
  set salon_id = v_salon_id
  where salon_id is null;

  select count(*) into v_remaining_null_count
  from public.product_history
  where salon_id is null;

  if v_remaining_null_count > 0 then
    raise exception
      'Ainda existem % registo(s) de historico de produtos com salon_id NULL apos o backfill. Fase P1 abortada antes de aplicar NOT NULL.',
      v_remaining_null_count;
  end if;
end $$;

-- ============================================================
-- 4) Só agora, com o backfill confirmado (passo 3 nunca chega aqui se
--    sobrar algum NULL), tornar a coluna obrigatoria.
-- ============================================================

alter table public.product_history
  alter column salon_id set not null;

-- ============================================================
-- 5) Indice para as consultas/policies futuras que vao filtrar por
--    salon_id (desempenho a escala de milhares de saloes).
-- ============================================================

create index if not exists product_history_salon_id_idx on public.product_history(salon_id);

-- ============================================================
-- 6) RLS nao e alterada nesta fase (fica using(true) como esta hoje) —
--    o corte de RLS de product_history fica para uma fase posterior,
--    depois de leitura/criacao estarem adaptadas na aplicacao. Esta
--    tabela nao tem nenhum trigger, por isso nao ha nada a preservar
--    nesse aspeto.
-- ============================================================

-- ============================================================
-- 7) Consultas de verificacao (apenas leitura — correr manualmente no
--    SQL Editor depois da migracao acima ter sido aplicada com sucesso).
-- ============================================================

-- 7a) Quantos registos existem no total
select count(*) as total_registos
from public.product_history;

-- 7b) Quantos continuam com salon_id NULL (deve ser sempre 0 aqui,
--     porque o passo 3 aborta a migracao inteira se sobrar algum)
select count(*) as registos_com_salon_id_null
from public.product_history
where salon_id is null;

-- 7c) Distribuicao de registos por salon_id
select salon_id, count(*) as total_registos
from public.product_history
group by salon_id
order by total_registos desc;
