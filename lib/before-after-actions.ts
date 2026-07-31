"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentSalonId } from "./salon";
import { isSupabaseConfigured } from "./supabase";
import type { BeforeAfterHistory } from "./types";

export type NewBeforeAfterHistoryInput = {
  customer_id: string;
  date: string;
  service: string;
  before_image_url: string;
  after_image_url: string;
  observations: string | null;
};

export type CreateBeforeAfterHistoryResult =
  | { data: BeforeAfterHistory; error: null }
  | { data: null; error: string };

/**
 * Cria um registo de antes e depois, sempre associado ao salon_id do
 * utilizador autenticado. Corre no servidor (server action) porque
 * getCurrentSalonId() depende de cookies/sessao so disponiveis nesse
 * contexto — o insert nunca acontece sem um salon_id resolvido e validado
 * aqui. O salon_id nunca e aceite vindo do browser: e sempre resolvido no
 * servidor a partir da sessao autenticada, nunca a partir do payload do
 * formulario. O upload das imagens para o Storage continua a ser feito no
 * browser antes de chamar esta action — aqui so entra o insert na tabela.
 */
export async function createBeforeAfterHistory(payload: NewBeforeAfterHistoryInput): Promise<CreateBeforeAfterHistoryResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. A transformacao nao foi criada."
    };
  }

  const insertPayload = { ...payload, salon_id: salonId };

  const { data, error } = await supabase
    .from("before_after_history")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as BeforeAfterHistory, error: null };
}
