"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Pencil, Save, Trash2 } from "lucide-react";
import { isDevMode, isSupabaseConfigured } from "@/lib/supabase";
import type { Appointment, Customer } from "@/lib/types";

const hours = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, "0")}:00`);
const professionalColors = [
  "border-l-blush bg-rose-50",
  "border-l-sage bg-emerald-50",
  "border-l-amber-500 bg-amber-50",
  "border-l-sky-500 bg-sky-50",
  "border-l-violet-500 bg-violet-50"
];

type AppointmentPayload = Omit<Appointment, "id" | "created_at" | "updated_at" | "customer">;

export function AgendaManager({
  customers,
  initialAppointments,
  initialDate
}: {
  customers: Customer[];
  initialAppointments: Appointment[];
  initialDate: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [status, setStatus] = useState("");

  const filteredAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.appointment_date === selectedDate)
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appointments, selectedDate]
  );

  async function handleDateChange(date: string) {
    setSelectedDate(date);
    setEditingAppointment(null);
    setStatus("");

    if (!isSupabaseConfigured) return;

    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from("appointments")
      .select("*, customer:customers(id, name, phone, whatsapp)")
      .eq("appointment_date", date)
      .order("appointment_time", { ascending: true });

    if (error) {
      console.error("[Beauty CRM Pro] Erro ao carregar agenda:", { date, error });
      setStatus(formatSupabaseError(error));
      return;
    }

    setAppointments((current) => {
      const otherDates = current.filter((appointment) => appointment.appointment_date !== date);
      return [...otherDates, ...((data as Appointment[]) ?? [])];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const payload: AppointmentPayload = {
      customer_id: String(form.get("customer_id")),
      service: String(form.get("service")),
      professional: String(form.get("professional")),
      appointment_date: String(form.get("appointment_date")),
      appointment_time: String(form.get("appointment_time")),
      duration_minutes: Number(form.get("duration_minutes") || 60),
      notes: String(form.get("notes") || "") || null
    };

    if (!isSupabaseConfigured) {
      setStatus("Configure o Supabase para guardar marcações.");
      return;
    }

    console.info("[Beauty CRM Pro] Supabase conectado: gravando marcacao em public.appointments.", {
      table: "appointments",
      devMode: isDevMode,
      action: editingAppointment ? "update" : "insert",
      payload
    });

    const supabase = createClientComponentClient();
    const query = editingAppointment
      ? supabase.from("appointments").update(payload).eq("id", editingAppointment.id).select("*, customer:customers(id, name, phone, whatsapp)").single()
      : supabase.from("appointments").insert(payload).select("*, customer:customers(id, name, phone, whatsapp)").single();

    const { data, error } = await query;

    if (error) {
      console.error("[Beauty CRM Pro] Erro ao gravar marcacao:", {
        table: "appointments",
        devMode: isDevMode,
        payload,
        error
      });
      setStatus(formatSupabaseError(error));
      return;
    }

    const savedAppointment = data as Appointment;
    setAppointments((current) => {
      const withoutCurrent = current.filter((appointment) => appointment.id !== savedAppointment.id);
      return [...withoutCurrent, savedAppointment];
    });
    setSelectedDate(savedAppointment.appointment_date);
    setEditingAppointment(null);
    setStatus(editingAppointment ? "Marcação atualizada com sucesso." : "Marcação criada com sucesso.");
    formElement.reset();
  }

  async function handleDelete(appointment: Appointment) {
    const confirmed = window.confirm(`Apagar marcação de ${appointment.customer?.name ?? "cliente"}?`);
    if (!confirmed) return;

    if (!isSupabaseConfigured) {
      setStatus("Configure o Supabase para apagar marcações.");
      return;
    }

    const supabase = createClientComponentClient();
    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);

    if (error) {
      console.error("[Beauty CRM Pro] Erro ao apagar marcacao:", { appointmentId: appointment.id, error });
      setStatus(formatSupabaseError(error));
      return;
    }

    setAppointments((current) => current.filter((item) => item.id !== appointment.id));
    if (editingAppointment?.id === appointment.id) setEditingAppointment(null);
    setStatus("Marcação apagada com sucesso.");
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">{editingAppointment ? "Editar marcação" : "Criar marcação"}</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Cliente</span>
            <select
              className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              name="customer_id"
              defaultValue={editingAppointment?.customer_id ?? ""}
              required
              key={editingAppointment?.id ?? "new-customer"}
            >
              <option value="">Selecionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Serviço" name="service" defaultValue={editingAppointment?.service} required />
          <Field label="Profissional" name="professional" defaultValue={editingAppointment?.professional} required />
          <Field label="Data" name="appointment_date" type="date" defaultValue={editingAppointment?.appointment_date ?? selectedDate} required />
          <Field label="Hora" name="appointment_time" type="time" defaultValue={editingAppointment?.appointment_time?.slice(0, 5)} required />
          <Field label="Duração" name="duration_minutes" type="number" defaultValue={String(editingAppointment?.duration_minutes ?? 60)} required />
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Observações</span>
            <textarea
              className="focus-ring mt-1 min-h-24 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              name="notes"
              defaultValue={editingAppointment?.notes ?? ""}
              key={editingAppointment?.id ?? "new-notes"}
            />
          </label>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {status ? <p className="rounded-md bg-champagne px-3 py-2 text-sm text-ink">{status}</p> : null}
          <div className="flex gap-2">
            {editingAppointment ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAppointment(null);
                  setStatus("");
                }}
                className="rounded-md border border-stone-200 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-champagne"
              >
                Cancelar
              </button>
            ) : null}
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white hover:bg-blush/90">
              <Save className="h-4 w-4" />
              {editingAppointment ? "Atualizar" : "Criar marcação"}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Calendário diário</h2>
            <p className="mt-1 text-sm text-stone-500">Horário das 08:00 às 20:00.</p>
          </div>
          <input
            className="focus-ring rounded-md border border-stone-300 px-3 py-2.5 text-sm"
            type="date"
            value={selectedDate}
            onChange={(event) => handleDateChange(event.target.value)}
          />
        </div>

        <div className="mt-5 divide-y divide-stone-100">
          {hours.map((hour) => {
            const hourAppointments = filteredAppointments.filter((appointment) => appointment.appointment_time.slice(0, 2) === hour.slice(0, 2));
            return (
              <div key={hour} className="grid gap-3 py-3 sm:grid-cols-[72px_1fr]">
                <div className="text-sm font-semibold text-stone-400">{hour}</div>
                <div className="space-y-2">
                  {hourAppointments.length === 0 ? <div className="rounded-md border border-dashed border-stone-200 px-3 py-3 text-sm text-stone-400">Livre</div> : null}
                  {hourAppointments.map((appointment) => (
                    <article key={appointment.id} className={`border-l-4 ${colorForProfessional(appointment.professional)} rounded-md px-3 py-3`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {appointment.appointment_time.slice(0, 5)} · {appointment.customer?.name ?? "Cliente"}
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {appointment.service} · {appointment.professional} · {appointment.duration_minutes} min
                          </p>
                          {appointment.notes ? <p className="mt-1 text-xs text-stone-500">{appointment.notes}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAppointment(appointment);
                              setStatus("");
                            }}
                            className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-champagne"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(appointment)}
                            className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Apagar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        key={`${name}-${defaultValue ?? "empty"}`}
      />
    </label>
  );
}

function colorForProfessional(professional: string) {
  const index = professional.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % professionalColors.length;
  return professionalColors[index];
}

function formatSupabaseError(error: { message: string; code?: string; details?: string; hint?: string }) {
  const parts = [
    `Erro Supabase: ${error.message}`,
    error.code ? `Codigo: ${error.code}` : null,
    error.details ? `Detalhes: ${error.details}` : null,
    error.hint ? `Hint: ${error.hint}` : null
  ].filter(Boolean);

  return parts.join(" | ");
}
