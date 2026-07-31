"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentSalonId } from "./salon";
import { isSupabaseConfigured } from "./supabase";
import type { Customer } from "./types";

export type NewCustomerInput = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  birth_date: string | null;
  last_visit: string | null;
  notes: string | null;
};

export type CreateCustomerResult =
  | { data: Customer; error: null }
  | { data: null; error: string };

/**
 * Cria um cliente novo, sempre associado ao salon_id do utilizador
 * autenticado. Corre no servidor (server action) porque getCurrentSalonId()
 * depende de cookies/sessao que so estao disponiveis nesse contexto — o
 * insert nunca acontece sem um salon_id resolvido e validado aqui.
 */
export async function createCustomer(payload: NewCustomerInput): Promise<CreateCustomerResult> {
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

  const insertPayload = { ...payload, salon_id: salonId };

  if (!salonId) {
    return {
      data: null,
      error: "Nao foi possivel identificar o salao do utilizador atual. O cliente nao foi criado."
    };
  }

  const { data, error } = await supabase.from("customers").insert(insertPayload).select("*").single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Customer, error: null };
}

export type UpdateCustomerResult =
  | { data: Customer; error: null }
  | { data: null; error: string };

/**
 * Atualiza um cliente existente, filtrando sempre por id E salon_id do
 * utilizador autenticado — nunca apenas por id. Corre no servidor (server
 * action) pela mesma razao do createCustomer: getCurrentSalonId() depende
 * de cookies/sessao so disponiveis nesse contexto. Se nao for possivel
 * resolver o salao, o update nao chega a ser executado.
 */
export async function updateCustomer(customerId: string, payload: NewCustomerInput): Promise<UpdateCustomerResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. O cliente nao foi atualizado."
    };
  }

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", customerId)
    .eq("salon_id", salonId)
    .select("*")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Customer, error: null };
}

export type DeleteCustomerResult = { success: true; error: null } | { success: false; error: string };

/**
 * Apaga um cliente existente, filtrando sempre por id E salon_id do
 * utilizador autenticado — nunca apenas por id. Corre no servidor (server
 * action) pela mesma razao do createCustomer/updateCustomer:
 * getCurrentSalonId() depende de cookies/sessao so disponiveis nesse
 * contexto. Se nao for possivel resolver o salao, a eliminacao nao chega a
 * ser executada.
 */
export async function deleteCustomer(customerId: string): Promise<DeleteCustomerResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase nao esta configurado." };
  }

  const supabase = createServerActionClient({ cookies });

  const salonId = await getCurrentSalonId(supabase);

  if (!salonId) {
    return {
      success: false,
      error: "Nao foi possivel identificar o salao do utilizador atual. O cliente nao foi apagado."
    };
  }

  const { error: deleteError } = await supabase.from("customers").delete().eq("id", customerId).eq("salon_id", salonId);

  if (deleteError) {
    const details = [deleteError.message, deleteError.code ? `Codigo: ${deleteError.code}` : null]
      .filter(Boolean)
      .join(" | ");
    return { success: false, error: `Erro Supabase: ${details}` };
  }

  return { success: true, error: null };
}
