import { getSupabaseServerClient } from "./supabase-server";
import { isSupabaseConfigured } from "./supabase";

type SupabaseServerClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

export interface AppContext {
  userId: string;
  companyId: string;
  salonId: string;
}

/**
 * Resolve o contexto completo do utilizador autenticado (userId, companyId
 * e salonId) — fonte unica de verdade para toda a resolucao de
 * utilizador/empresa/salao. Duas fontes possiveis (uniao, tal como
 * current_salon_ids() ao nivel da base de dados):
 * - salon_members: acesso direto e restrito a um unico salao;
 * - company_members: acesso a todos os saloes da empresa (usa o primeiro
 *   encontrado; hoje cada empresa tem apenas um salao).
 *
 * Devolve null (nunca lanca excecao) quando: Supabase nao esta configurado,
 * nao ha sessao autenticada, ou o utilizador nao tem nenhuma
 * membership/salao associado. Quem chama decide como tratar o null
 * (bloquear a acao, mostrar erro, etc.).
 *
 * Aceita opcionalmente um client Supabase ja criado. Isto e necessario para
 * Server Actions/Route Handlers: esses contextos precisam de
 * createServerActionClient() (le E escreve cookies, para poder renovar a
 * sessao), enquanto Server Components (o uso por omissao, via
 * getSupabaseServerClient()) so podem ler cookies. Usar o client errado
 * pode deixar a sessao inconsistente nesse contexto.
 */
export async function getCurrentContext(client?: SupabaseServerClient): Promise<AppContext | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = client ?? getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.info("[Beauty CRM Pro] getCurrentContext: sem sessao autenticada.");
    return null;
  }

  const { data: directMembership, error: directError } = await supabase
    .from("salon_members")
    .select("salon_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (directError) {
    console.error("[Beauty CRM Pro] getCurrentContext: erro ao ler salon_members.", directError);
    return null;
  }

  if (directMembership?.salon_id) {
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("company_id")
      .eq("id", directMembership.salon_id)
      .maybeSingle();

    if (salonError || !salon?.company_id) {
      console.error("[Beauty CRM Pro] getCurrentContext: erro ao resolver company_id do salao.", salonError);
      return null;
    }

    console.info("[Beauty CRM Pro] getCurrentContext: resolvido via salon_members.", {
      salonId: directMembership.salon_id
    });

    return {
      userId: user.id,
      companyId: salon.company_id as string,
      salonId: directMembership.salon_id as string
    };
  }

  const { data: companyMemberships, error: companyError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id);

  if (companyError) {
    console.error("[Beauty CRM Pro] getCurrentContext: erro ao ler company_members.", companyError);
    return null;
  }

  const companyIds = (companyMemberships ?? []).map((membership) => membership.company_id as string);
  if (companyIds.length === 0) {
    console.info("[Beauty CRM Pro] getCurrentContext: utilizador sem salon_members nem company_members.");
    return null;
  }

  const { data: companySalon, error: salonError } = await supabase
    .from("salons")
    .select("id, company_id")
    .in("company_id", companyIds)
    .limit(1)
    .maybeSingle();

  if (salonError) {
    console.error("[Beauty CRM Pro] getCurrentContext: erro ao ler salons pela company.", salonError);
    return null;
  }

  if (!companySalon?.id || !companySalon.company_id) {
    console.info("[Beauty CRM Pro] getCurrentContext: company do utilizador nao tem nenhum salao associado.");
    return null;
  }

  console.info("[Beauty CRM Pro] getCurrentContext: resolvido via company_members.", { salonId: companySalon.id });

  return {
    userId: user.id,
    companyId: companySalon.company_id as string,
    salonId: companySalon.id as string
  };
}

/**
 * Adaptador fino sobre getCurrentContext() — mantido por compatibilidade
 * com todo o codigo existente (lib/data.ts, lib/customer-actions.ts) que so
 * precisa do salon_id. Mesma assinatura e mesmo comportamento observavel de
 * sempre (Promise<string | null>, null nos mesmos casos); toda a logica de
 * resolucao vive agora exclusivamente em getCurrentContext().
 */
export async function getCurrentSalonId(client?: SupabaseServerClient): Promise<string | null> {
  const context = await getCurrentContext(client);
  return context?.salonId ?? null;
}
