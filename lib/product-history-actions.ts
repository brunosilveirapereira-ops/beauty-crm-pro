"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentSalonId } from "./salon";
import { isSupabaseConfigured } from "./supabase";
import type { ProductHistory } from "./types";

export type NewProductHistoryInput = {
  customer_id: string;
  date: string;
  brand: string;
  product_name: string;
  quantity: string | null;
  observations: string | null;
};

export type CreateProductHistoryResult =
  | { data: ProductHistory; error: null }
  | { data: null; error: string };

/**
 * Cria um registo de historico de produtos, sempre associado ao salon_id
 * do utilizador autenticado. Corre no servidor (server action) porque
 * getCurrentSalonId() depende de cookies/sessao so disponiveis nesse
 * contexto — o insert nunca acontece sem um salon_id resolvido e validado
 * aqui. O salon_id nunca e aceite vindo do browser: e sempre resolvido no
 * servidor a partir da sessao autenticada, nunca a partir do payload do
 * formulario.
 */
export async function createProductHistory(payload: NewProductHistoryInput): Promise<CreateProductHistoryResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. O produto nao foi criado."
    };
  }

  const insertPayload = { ...payload, salon_id: salonId };

  const { data, error } = await supabase
    .from("product_history")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as ProductHistory, error: null };
}
