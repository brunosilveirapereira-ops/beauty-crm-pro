import { getSupabaseServerClient } from "./supabase-server";
import { isSupabaseConfigured } from "./supabase";

/**
 * Resolve o salon_id do utilizador autenticado, a partir de duas fontes
 * possiveis (uniao, tal como current_salon_ids() ao nivel da base de dados):
 * - salon_members: acesso direto e restrito a um unico salao;
 * - company_members: acesso a todos os saloes da empresa (usa o primeiro
 *   encontrado; hoje cada empresa tem apenas um salao).
 *
 * Devolve null (nunca lanca excecao) quando: Supabase nao esta configurado,
 * nao ha sessao autenticada, ou o utilizador nao tem nenhuma membership.
 * Quem chama decide como tratar o null (bloquear a acao, mostrar erro, etc.).
 */
export async function getCurrentSalonId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.info("[Beauty CRM Pro] getCurrentSalonId: sem sessao autenticada.");
    return null;
  }

  const { data: directMembership, error: directError } = await supabase
    .from("salon_members")
    .select("salon_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (directError) {
    console.error("[Beauty CRM Pro] getCurrentSalonId: erro ao ler salon_members.", directError);
    return null;
  }

  if (directMembership?.salon_id) {
    return directMembership.salon_id as string;
  }

  const { data: companyMemberships, error: companyError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id);

  if (companyError) {
    console.error("[Beauty CRM Pro] getCurrentSalonId: erro ao ler company_members.", companyError);
    return null;
  }

  const companyIds = (companyMemberships ?? []).map((membership) => membership.company_id as string);
  if (companyIds.length === 0) {
    console.info("[Beauty CRM Pro] getCurrentSalonId: utilizador sem salon_members nem company_members.");
    return null;
  }

  const { data: companySalon, error: salonError } = await supabase
    .from("salons")
    .select("id")
    .in("company_id", companyIds)
    .limit(1)
    .maybeSingle();

  if (salonError) {
    console.error("[Beauty CRM Pro] getCurrentSalonId: erro ao ler salons pela company.", salonError);
    return null;
  }

  if (!companySalon?.id) {
    console.info("[Beauty CRM Pro] getCurrentSalonId: company do utilizador nao tem nenhum salao associado.");
    return null;
  }

  return companySalon.id as string;
}
