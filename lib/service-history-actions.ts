"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentSalonId } from "./salon";
import { isSupabaseConfigured } from "./supabase";
import type { ServiceHistory } from "./types";

export type NewServiceHistoryInput = {
  customer_id: string;
  professional_id: string | null;
  date: string;
  service: string;
  professional: string | null;
  value: number;
  formula_products: string | null;
  notes: string | null;
};

export type CreateServiceHistoryResult =
  | { data: ServiceHistory; error: null }
  | { data: null; error: string };

/**
 * Cria um registo de historico de servicos, sempre associado ao salon_id
 * do utilizador autenticado. Corre no servidor (server action) porque
 * getCurrentSalonId() depende de cookies/sessao so disponiveis nesse
 * contexto — o insert nunca acontece sem um salon_id resolvido e validado
 * aqui. O salon_id nunca e aceite vindo do browser: e sempre resolvido no
 * servidor a partir da sessao autenticada, nunca a partir do payload do
 * formulario.
 *
 * Usada tanto por ServiceForm (/servicos) como por VisitHistoryManager
 * (/clientes/[id]) — os dois escrevem na mesma tabela service_history,
 * por isso partilham exatamente esta mesma logica de insert em vez de a
 * duplicarem cada um no seu componente.
 */
export async function createServiceHistory(payload: NewServiceHistoryInput): Promise<CreateServiceHistoryResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: "Supabase nao esta configurado."
    };
  }

  const supabase = createServerActionClient({ cookies });

  const salonId = await getCurrentSalonId(supabase);

  if (!salonId) {
    return {
      data: null,
      error: "Nao foi possivel identificar o salao do utilizador atual. O servico nao foi criado."
    };
  }

  const insertPayload = { ...payload, salon_id: salonId };

  const { data, error } = await supabase
    .from("service_history")
    .insert(insertPayload)
    .select("*, customer:customers(id, name, whatsapp), professional_profile:professionals(id, name, commission_percentage, active)")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as ServiceHistory, error: null };
}
