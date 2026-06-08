"use client";

import { useState, type FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Plus, Save } from "lucide-react";
import { isDevMode } from "@/lib/supabase";
import type { ColorHistory, Customer } from "@/lib/types";

type ColorPayload = Omit<ColorHistory, "id" | "created_at">;

export function ColorHistoryManager({
  customer,
  initialColors
}: {
  customer: Customer;
  initialColors: ColorHistory[];
}) {
  const [colors, setColors] = useState(initialColors);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const payload: ColorPayload = {
      customer_id: customer.id,
      color_date: String(form.get("color_date")),
      dye_brand: String(form.get("dye_brand")),
      color_used: String(form.get("color_used")),
      oxidant: String(form.get("oxidant") || "") || null,
      notes: String(form.get("notes") || "") || null
    };

    console.info("[Beauty CRM Pro] Supabase conectado: gravando coloracao em public.color_history.", {
      table: "color_history",
      devMode: isDevMode,
      customerId: customer.id,
      payload
    });

    const supabase = createClientComponentClient();
    const { data, error } = await supabase.from("color_history").insert(payload).select("*").single();

    if (error) {
      const visibleError = formatSupabaseError(error);
      console.error("[Beauty CRM Pro] Erro ao gravar coloracao no Supabase:", {
        table: "color_history",
        devMode: isDevMode,
        customerId: customer.id,
        payload,
        error
      });
      setStatus(visibleError);
      return;
    }

    setColors((current) =>
      [data as ColorHistory, ...current].sort((a, b) => new Date(b.color_date).getTime() - new Date(a.color_date).getTime())
    );
    setStatus("Coloração guardada com sucesso.");
    formElement.reset();
    setShowForm(false);
  }

  return (
    <section className="mt-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Histórico de Coloração</h2>
          <p className="mt-1 text-sm text-stone-500">Registos técnicos de tintas e fórmulas por cliente.</p>
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
          Adicionar Coloração
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-stone-200 bg-champagne/40 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Data" name="color_date" type="date" required />
            <Field label="Marca da tinta" name="dye_brand" required />
            <Field label="Cor utilizada" name="color_used" required />
            <Field label="Oxidante" name="oxidant" />
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
              Guardar coloração
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
              <th className="py-2 font-semibold">Marca da tinta</th>
              <th className="py-2 font-semibold">Cor utilizada</th>
              <th className="py-2 font-semibold">Oxidante</th>
              <th className="py-2 font-semibold">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {colors.map((color) => (
              <tr key={color.id}>
                <td className="py-3 text-stone-600">{color.color_date}</td>
                <td className="py-3 font-medium text-ink">{color.dye_brand}</td>
                <td className="py-3 text-stone-600">{color.color_used}</td>
                <td className="py-3 text-stone-600">{color.oxidant}</td>
                <td className="max-w-xs truncate py-3 text-stone-600">{color.notes}</td>
              </tr>
            ))}
            {colors.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-sm text-stone-500" colSpan={5}>
                  Ainda não existem colorações registadas.
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
