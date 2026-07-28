"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentSalonId } from "./salon";
import { isSupabaseConfigured } from "./supabase";
import type { Professional } from "./types";

export type NewProfessionalInput = {
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  commission_percentage: number;
  active: boolean;
};

export type CreateProfessionalResult =
  | { data: Professional; error: null }
  | { data: null; error: string };

/**
 * Cria um profissional novo, sempre associado ao salon_id do utilizador
 * autenticado. Corre no servidor (server action) porque getCurrentSalonId()
 * depende de cookies/sessao que so estao disponiveis nesse contexto — o
 * insert nunca acontece sem um salon_id resolvido e validado aqui. O
 * salon_id nunca e aceite vindo do browser: e sempre resolvido no servidor
 * a partir da sessao autenticada, nunca a partir do payload do formulario.
 */
export async function createProfessional(payload: NewProfessionalInput): Promise<CreateProfessionalResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: "Supabase nao esta configurado."
    };
  }

  // createServerActionClient (nao createServerComponentClient) e o client
  // correto dentro de uma Server Action: consegue ler E escrever cookies,
  // necessario para manter a sessao consistente ao longo desta execucao.
  // O mesmo client e reutilizado para resolver o salao e para o insert,
  // para garantir que ambos correm sob exatamente a mesma sessao.
  const supabase = createServerActionClient({ cookies });

  const salonId = await getCurrentSalonId(supabase);

  if (!salonId) {
    return {
      data: null,
      error: "Nao foi possivel identificar o salao do utilizador atual. O profissional nao foi criado."
    };
  }

  const insertPayload = { ...payload, salon_id: salonId };

  const { data, error } = await supabase.from("professionals").insert(insertPayload).select("*").single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Professional, error: null };
}

export type UpdateProfessionalResult =
  | { data: Professional; error: null }
  | { data: null; error: string };

/**
 * Atualiza um profissional existente, filtrando sempre por id E salon_id do
 * utilizador autenticado — nunca apenas por id. Corre no servidor (server
 * action) pela mesma razao do createProfessional: getCurrentSalonId()
 * depende de cookies/sessao so disponiveis nesse contexto. Se nao for
 * possivel resolver o salao, o update nao chega a ser executado. O
 * salon_id nunca e aceite vindo do browser: e sempre resolvido no servidor
 * a partir da sessao autenticada.
 */
export async function updateProfessional(
  professionalId: string,
  payload: NewProfessionalInput
): Promise<UpdateProfessionalResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. O profissional nao foi atualizado."
    };
  }

  const { data, error } = await supabase
    .from("professionals")
    .update(payload)
    .eq("id", professionalId)
    .eq("salon_id", salonId)
    .select("*")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Professional, error: null };
}

export type DeactivateProfessionalResult =
  | { data: Professional; error: null }
  | { data: null; error: string };

/**
 * Desativa (eliminacao logica, active = false) um profissional existente,
 * filtrando sempre por id E salon_id do utilizador autenticado — nunca
 * apenas por id. Corre no servidor (server action) pela mesma razao do
 * createProfessional/updateProfessional: getCurrentSalonId() depende de
 * cookies/sessao so disponiveis nesse contexto. Se nao for possivel
 * resolver o salao, a operacao nao chega a ser executada. O salon_id nunca
 * e aceite vindo do browser: e sempre resolvido no servidor a partir da
 * sessao autenticada.
 */
export async function deactivateProfessional(professionalId: string): Promise<DeactivateProfessionalResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. O profissional nao foi desativado."
    };
  }

  const { data, error } = await supabase
    .from("professionals")
    .update({ active: false })
    .eq("id", professionalId)
    .eq("salon_id", salonId)
    .select("*")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Professional, error: null };
}
