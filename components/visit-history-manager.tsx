"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Plus, Save } from "lucide-react";
import { isDevMode } from "@/lib/supabase";
import type { Customer, Professional, VisitHistory } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

type VisitPayload = Omit<VisitHistory, "id" | "customer">;

export function VisitHistoryManager({
  customer,
  initialVisits,
  professionals
}: {
  customer: Customer;
  initialVisits: VisitHistory[];
  professionals: Professional[];
}) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const professionalId = String(form.get("professional_id") || "") || null;
    const selectedProfessional = professionals.find((professional) => professional.id === professionalId) ?? null;
    const fallbackProfessional = String(form.get("professional_name") || "") || null;

    const payload: VisitPayload = {
      customer_id: customer.id,
      professional_id: professionalId,
      service: String(form.get("service_name")),
      professional: selectedProfessional?.name ?? fallbackProfessional,
      date: String(form.get("visit_date")),
      value: Number(form.get("value") || 0),
      formula_products: null,
      notes: String(form.get("notes") || "") || null
    };

    console.info("[Beauty CRM Pro] Supabase conectado: gravando visita em public.service_history.", {
      table: "service_history",
      devMode: isDevMode,
      customerId: customer.id,
      payload
    });

    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from("service_history")
      .insert(payload)
      .select("*, professional_profile:professionals(id, name, commission_percentage, active)")
      .single();

    if (error) {
      const visibleError = formatSupabaseError(error);
      console.error("[Beauty CRM Pro] Erro ao gravar visita no Supabase:", {
        table: "service_history",
        devMode: isDevMode,
        customerId: customer.id,
        payload,
        error
      });
      setStatus(visibleError);
      return;
    }

    setVisits((current) =>
      [data as VisitHistory, ...current].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    setStatus("Visita guardada com sucesso.");
    formElement.reset();
    setShowForm(false);
    router.refresh();
  }

  return (
    <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Histórico de Visitas</h2>
          <p className="mt-1 text-sm text-stone-500">Visitas registadas para {customer.name}.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((current) => !current);
            setStatus("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white hover:bg-blush/90"
        >
          <Plus className="h-4 w-4" />
          Adicionar Visita
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-stone-200 bg-champagne/40 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Serviço" name="service_name" required />
            <label>
              <span className="text-sm font-medium text-stone-700">Profissional cadastrado</span>
              <select className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm" name="professional_id">
                <option value="">Selecionar profissional</option>
                {professionals
                  .filter((professional) => professional.active)
                  .map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
              </select>
            </label>
            <Field label="Profissional (fallback)" name="professional_name" />
            <Field label="Data" name="visit_date" type="date" required />
            <Field label="Valor" name="value" type="number" required />
            <label className="md:col-span-2">
              <span className="text-sm font-medium text-stone-700">Observações</span>
              <textarea
                className="focus-ring mt-1 min-h-24 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
                name="notes"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-600">{status}</p>
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite">
              <Save className="h-4 w-4" />
              Guardar visita
            </button>
          </div>
        </form>
      ) : status ? (
        <p className="mt-4 rounded-md bg-champagne px-3 py-2 text-sm text-ink">{status}</p>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-stone-400">
            <tr>
              <th className="py-2 font-semibold">Data</th>
              <th className="py-2 font-semibold">Serviço</th>
              <th className="py-2 font-semibold">Profissional</th>
              <th className="py-2 text-right font-semibold">Valor</th>
              <th className="py-2 font-semibold">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td className="py-3 text-stone-600">{visit.date}</td>
                <td className="py-3 font-medium text-ink">{visit.service}</td>
                <td className="py-3 text-stone-600">{visit.professional_profile?.name ?? visit.professional}</td>
                <td className="py-3 text-right font-medium text-ink">{currency.format(Number(visit.value))}</td>
                <td className="max-w-xs truncate py-3 text-stone-600">{visit.notes}</td>
              </tr>
            ))}
            {visits.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-sm text-stone-500" colSpan={5}>
                  Ainda não existem visitas registadas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm" name={name} type={type} required={required} />
    </label>
  );
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
