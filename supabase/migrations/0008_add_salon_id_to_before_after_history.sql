-- Fase B1 da migracao multi-salao do modulo Antes e Depois
-- Adiciona salon_id a public.before_after_history e associa todos os
-- registos existentes ao "Salao Principal" criado na Fase 2
-- (0002_create_initial_company_and_salon.sql, slug = 'salao-principal').
--
-- Nao toca em RLS, Storage, policies do bucket customer-transformations,
-- login, middleware, triggers, leitura, criacao, componentes ou qualquer
-- outra tabela de negocio. Nao apaga nem altera nenhum dado existente do
-- historico de antes e depois — apenas preenche a nova coluna.
--
-- Ordem desenhada para nunca deixar a tabela num estado invalido:
-- 1) coluna nullable -> 2) FK -> 3) backfill + verificacao -> 4) NOT NULL -> 5) indice.

-- ============================================================
-- 1) Adicionar a coluna, permitindo NULL, para nao rebentar com as
--    linhas ja existentes de public.before_after_history.
-- ============================================================

alter table public.before_after_history
  add column if not exists salon_id uuid;

-- ============================================================
-- 2) Referenciar public.salons(id) (uuid). "on delete restrict" impede
--    que um salao seja apagado enquanto ainda tiver historico de antes e
--    depois associado (protege contra perda acidental de dados de
--    negocio) — mesma convencao usada em 0003, 0004, 0005, 0006 e 0007.
-- ============================================================

alter table public.before_after_history
  drop constraint if exists before_after_history_salon_id_fkey;

alter table public.before_after_history
  add constraint before_after_history_salon_id_fkey
  foreign key (salon_id) references public.salons(id) on delete restrict;

-- ============================================================
-- 3) Localizar o "Salao Principal" pelo slug (identificador estavel e
--    unico, criado na Fase 2 — nao usamos um UUID fixo/hardcoded; o salao
--    e sempre resolvido a partir de dados ja existentes na base de dados)
--    e associar todos os registos de antes e depois que ainda nao tenham
--    salon_id preenchido.
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
      'Salao "Salao Principal" (slug = salao-principal) nao encontrado. Fase B1 abortada — nenhum registo foi alterado.';
  end if;

  update public.before_after_history
  set salon_id = v_salon_id
  where salon_id is null;

  select count(*) into v_remaining_null_count
  from public.before_after_history
  where salon_id is null;

  if v_remaining_null_count > 0 then
    raise exception
      'Ainda existem % registo(s) de antes e depois com salon_id NULL apos o backfill. Fase B1 abortada antes de aplicar NOT NULL.',
      v_remaining_null_count;
  end if;
end $$;

-- ============================================================
-- 4) Só agora, com o backfill confirmado (passo 3 nunca chega aqui se
--    sobrar algum NULL), tornar a coluna obrigatoria.
-- ============================================================

alter table public.before_after_history
  alter column salon_id set not null;

-- ============================================================
-- 5) Indice para as consultas/policies futuras que vao filtrar por
--    salon_id (desempenho a escala de milhares de saloes).
-- ============================================================

create index if not exists before_after_history_salon_id_idx on public.before_after_history(salon_id);

-- ============================================================
-- 6) RLS nao e alterada nesta fase (ficam as policies using(true)/
--    with check(true) como estao hoje) — o corte de RLS de
--    before_after_history fica para uma fase posterior, depois de
--    leitura/criacao estarem adaptadas na aplicacao. Storage e as
--    policies do bucket customer-transformations tambem nao sao
--    alteradas nesta fase.
-- ============================================================

-- ============================================================
-- 7) Consultas de verificacao (apenas leitura — correr manualmente no
--    SQL Editor depois da migracao acima ter sido aplicada com sucesso).
-- ============================================================

-- 7a) Quantos registos existem no total
select count(*) as total_registos
from public.before_after_history;

-- 7b) Quantos continuam com salon_id NULL (deve ser sempre 0 aqui,
--     porque o passo 3 aborta a migracao inteira se sobrar algum)
select count(*) as registos_com_salon_id_null
from public.before_after_history
where salon_id is null;

-- 7c) Distribuicao de registos por salon_id
select salon_id, count(*) as total_registos
from public.before_after_history
group by salon_id
order by total_registos desc;
