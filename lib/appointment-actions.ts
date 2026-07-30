"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { getCurrentSalonId } from "./salon";
import { isSupabaseConfigured } from "./supabase";
import type { Appointment } from "./types";

export type GetAppointmentsByDateResult = { data: Appointment[]; error: string | null };

/**
 * Le os agendamentos de uma data, filtrados sempre por salon_id do
 * utilizador autenticado. Existe como Server Action (nao como funcao em
 * lib/data.ts) porque e chamada a partir de um Client Component
 * (agenda-manager.tsx, ao mudar de data) — getCurrentSalonId() depende de
 * cookies/sessao so disponiveis no servidor, por isso a leitura nunca pode
 * ser feita diretamente no browser sem filtro de salao.
 *
 */
export async function getAppointmentsByDateAction(date: string): Promise<GetAppointmentsByDateResult> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  const supabase = createServerActionClient({ cookies });

  const salonId = await getCurrentSalonId(supabase);

  if (!salonId) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*, customer:customers(id, name, phone, whatsapp)")
    .eq("appointment_date", date)
    .eq("salon_id", salonId)
    .order("appointment_time", { ascending: true });

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: [], error: `Erro Supabase: ${details}` };
  }

  return { data: data as Appointment[], error: null };
}

export type NewAppointmentInput = {
  customer_id: string;
  service: string;
  professional: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  notes: string | null;
};

export type CreateAppointmentResult =
  | { data: Appointment; error: null }
  | { data: null; error: string };

/**
 * Cria uma marcacao nova, sempre associada ao salon_id do utilizador
 * autenticado. Corre no servidor (server action) porque getCurrentSalonId()
 * depende de cookies/sessao que so estao disponiveis nesse contexto — o
 * insert nunca acontece sem um salon_id resolvido e validado aqui. O
 * salon_id nunca e aceite vindo do browser: e sempre resolvido no servidor
 * a partir da sessao autenticada, nunca a partir do payload do formulario.
 */
export async function createAppointment(payload: NewAppointmentInput): Promise<CreateAppointmentResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. A marcacao nao foi criada."
    };
  }

  const insertPayload = { ...payload, salon_id: salonId };

  const { data, error } = await supabase
    .from("appointments")
    .insert(insertPayload)
    .select("*, customer:customers(id, name, phone, whatsapp)")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Appointment, error: null };
}

export type UpdateAppointmentResult =
  | { data: Appointment; error: null }
  | { data: null; error: string };

/**
 * Atualiza uma marcacao existente, sempre restrita ao salon_id do
 * utilizador autenticado. Corre no servidor (server action) pela mesma
 * razao de createAppointment(): getCurrentSalonId() so pode ser resolvido
 * aqui. O filtro .eq("salon_id", salonId) e obrigatorio — sem ele, o id
 * sozinho permitiria editar uma marcacao de outro salao. O salon_id nunca
 * e aceite vindo do browser: e sempre resolvido no servidor a partir da
 * sessao autenticada.
 */
export async function updateAppointment(
  appointmentId: string,
  payload: NewAppointmentInput
): Promise<UpdateAppointmentResult> {
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
      error: "Nao foi possivel identificar o salao do utilizador atual. A marcacao nao foi atualizada."
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(payload)
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .select("*, customer:customers(id, name, phone, whatsapp)")
    .single();

  if (error) {
    const details = [error.message, error.code ? `Codigo: ${error.code}` : null].filter(Boolean).join(" | ");
    return { data: null, error: `Erro Supabase: ${details}` };
  }

  return { data: data as Appointment, error: null };
}

export type DeleteAppointmentResult = { error: string | null };

/**
 * Apaga uma marcacao existente, sempre restrita ao salon_id do utilizador
 * autenticado. Corre no servidor (server action) pela mesma razao de
 * updateAppointment(): getCurrentSalonId() so pode ser resolvido aqui. O
 * filtro .eq("salon_id", salonId) e obrigatorio — sem ele, o id sozinho
 * permitiria apagar uma marcacao de outro salao. O salon_id nunca e aceite
 * vindo do browser: e sempre resolvido no servidor a partir da sessao
 * autenticada.
 */
export async function deleteAppointment(appointmentId: string): Promise<DeleteAppointmentResult> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase nao esta configurado." };
  }

  const supabase = createServerActionClient({ cookies });

  const salonId = await getCurrentSalonId(supabase);

  if (!salonId) {
    return { error: "Nao foi possivel identificar o salao do utilizador atual. A marcacao nao foi apagada." };
  }

  const { error: deleteError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("salon_id", salonId);

  if (deleteError) {
    const details = [deleteError.message, deleteError.code ? `Codigo: ${deleteError.code}` : null].filter(Boolean).join(" | ");
    return { error: `Erro Supabase: ${details}` };
  }

  return { error: null };
}
