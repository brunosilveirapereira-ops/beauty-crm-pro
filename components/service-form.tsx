"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Save } from "lucide-react";
import { localServicesStorageKey } from "@/lib/risk";
import { isDevMode, isSupabaseConfigured } from "@/lib/supabase";
import type { Customer, ServiceHistory } from "@/lib/types";

type ServicePayload = Omit<ServiceHistory, "id" | "customer">;

export function ServiceForm({
  customers,
  onServiceSaved
}: {
  customers: Customer[];
  onServiceSaved: (service: ServiceHistory) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const customerId = String(form.get("customer_id"));
    const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? null;

    const payload: ServicePayload = {
      customer_id: customerId,
      date: String(form.get("date")),
      service: String(form.get("service")),
      professional: String(form.get("professional") || "") || null,
      value: Number(form.get("value") || 0),
      formula_products: String(form.get("formula_products") || "") || null,
      notes: String(form.get("notes") || "") || null
    };

    if (!isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Modo local: guardando servico em localStorage.");
      const localService: ServiceHistory = {
        ...payload,
        id: `local-service-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        customer: selectedCustomer
      };
      const currentServices = readStoredServices();
      window.localStorage.setItem(localServicesStorageKey, JSON.stringify([localService, ...currentServices]));

      onServiceSaved(localService);
      setStatus("Servico guardado com sucesso.");
      formElement.reset();
      return;
    }

    console.info("[Beauty CRM Pro] Supabase conectado: gravando servico em public.service_history.", {
      customerId,
      devMode: isDevMode,
      table: "service_history",
      payload
    });
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
      .from("service_history")
      .insert(payload)
      .select("*, customer:customers(id, name, whatsapp)")
      .single();

    if (error) {
      const visibleError = formatSupabaseError(error);
      console.error("[Beauty CRM Pro] Erro ao gravar servico no Supabase:", {
        table: "service_history",
        devMode: isDevMode,
        payload,
        error
      });
      setStatus(visibleError);
      return;
    }

    onServiceSaved(data as ServiceHistory);
    setStatus("Servico guardado com sucesso.");
    formElement.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-medium text-stone-700">Cliente</span>
          <select className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm" name="customer_id" required>
            <option value="">Selecionar cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Data" name="date" type="date" required />
        <Field label="Servico" name="service" required />
        <Field label="Profissional" name="professional" />
        <Field label="Valor" name="value" type="number" required />
        <Field label="Formula/produtos usados" name="formula_products" />
        <label className="md:col-span-2">
          <span className="text-sm font-medium text-stone-700">Observacoes</span>
          <textarea
            className="focus-ring mt-1 min-h-24 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
            name="notes"
          />
        </label>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">{status}</p>
        <button className="flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white hover:bg-blush/90">
          <Save className="h-4 w-4" />
          Guardar servico
        </button>
      </div>
    </form>
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

function readStoredServices() {
  const saved = window.localStorage.getItem(localServicesStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as ServiceHistory[];
  } catch {
    window.localStorage.removeItem(localServicesStorageKey);
    return [];
  }
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
