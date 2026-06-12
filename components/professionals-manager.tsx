"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Pencil, Save, UserMinus } from "lucide-react";
import { buildCommissionReport, getCurrentMonthKey } from "@/lib/commissions";
import { isDevMode, isSupabaseConfigured } from "@/lib/supabase";
import type { Professional, ServiceHistory } from "@/lib/types";

export const localProfessionalsStorageKey = "beauty-crm-pro-professionals";
const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

type ProfessionalPayload = Omit<Professional, "id" | "created_at">;

export function ProfessionalsManager({
  initialProfessionals,
  initialServices
}: {
  initialProfessionals: Professional[];
  initialServices: ServiceHistory[];
}) {
  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [status, setStatus] = useState("");
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());

  useEffect(() => {
    if (isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Supabase conectado: profissionais lidos de public.professionals.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: lendo profissionais do localStorage/demo.");
    const saved = window.localStorage.getItem(localProfessionalsStorageKey);
    if (!saved) return;

    try {
      setProfessionals(JSON.parse(saved) as Professional[]);
    } catch {
      window.localStorage.removeItem(localProfessionalsStorageKey);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    window.localStorage.setItem(localProfessionalsStorageKey, JSON.stringify(professionals));
  }, [professionals]);

  const commissionReport = useMemo(
    () => buildCommissionReport(professionals, initialServices, monthKey),
    [initialServices, monthKey, professionals]
  );

  const totals = useMemo(
    () =>
      commissionReport.reduce(
        (summary, item) => ({
          revenue: summary.revenue + item.totalRevenue,
          commissions: summary.commissions + item.commissionValue,
          salon: summary.salon + item.salonValue
        }),
        { revenue: 0, commissions: 0, salon: 0 }
      ),
    [commissionReport]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload: ProfessionalPayload = {
      name: String(form.get("name")),
      phone: String(form.get("phone") || "") || null,
      email: String(form.get("email") || "") || null,
      role: String(form.get("role") || "") || null,
      commission_percentage: Number(form.get("commission_percentage") || 0),
      active: form.get("active") === "on"
    };

    if (!isSupabaseConfigured) {
      const localProfessional: Professional = {
        ...payload,
        id: editingProfessional?.id ?? `local-professional-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        created_at: editingProfessional?.created_at ?? new Date().toISOString()
      };
      setProfessionals((current) => upsertProfessional(current, localProfessional));
      setEditingProfessional(null);
      setStatus(editingProfessional ? "Profissional atualizado com sucesso." : "Profissional criado com sucesso.");
      formElement.reset();
      return;
    }

    console.info("[Beauty CRM Pro] Supabase conectado: gravando profissional em public.professionals.", {
      table: "professionals",
      devMode: isDevMode,
      payload
    });

    const supabase = createClientComponentClient();
    const query = editingProfessional
      ? supabase.from("professionals").update(payload).eq("id", editingProfessional.id).select("*").single()
      : supabase.from("professionals").insert(payload).select("*").single();

    const { data, error } = await query;
    if (error) {
      console.error("[Beauty CRM Pro] Erro ao gravar profissional no Supabase:", {
        table: "professionals",
        devMode: isDevMode,
        payload,
        error
      });
      setStatus(formatSupabaseError(error));
      return;
    }

    setProfessionals((current) => upsertProfessional(current, data as Professional));
    setEditingProfessional(null);
    setStatus(editingProfessional ? "Profissional atualizado com sucesso." : "Profissional criado com sucesso.");
    formElement.reset();
  }

  async function handleDeactivate(professional: Professional) {
    const confirmed = window.confirm(`Desativar ${professional.name}?`);
    if (!confirmed) return;

    if (!isSupabaseConfigured) {
      setProfessionals((current) => current.map((item) => (item.id === professional.id ? { ...item, active: false } : item)));
      setStatus("Profissional desativado com sucesso.");
      return;
    }

    const supabase = createClientComponentClient();
    const { data, error } = await supabase.from("professionals").update({ active: false }).eq("id", professional.id).select("*").single();

    if (error) {
      console.error("[Beauty CRM Pro] Erro ao desativar profissional no Supabase:", {
        table: "professionals",
        devMode: isDevMode,
        professionalId: professional.id,
        error
      });
      setStatus(formatSupabaseError(error));
      return;
    }

    setProfessionals((current) => upsertProfessional(current, data as Professional));
    setStatus("Profissional desativado com sucesso.");
  }

  return (
    <>
      <form
        key={editingProfessional?.id ?? "new-professional"}
        onSubmit={handleSubmit}
        className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink">{editingProfessional ? "Editar profissional" : "Novo profissional"}</h2>
          {editingProfessional ? (
            <button
              type="button"
              onClick={() => {
                setEditingProfessional(null);
                setStatus("");
              }}
              className="text-sm font-semibold text-stone-500 hover:text-ink"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Nome" name="name" defaultValue={editingProfessional?.name} required />
          <Field label="Telefone" name="phone" defaultValue={editingProfessional?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={editingProfessional?.email} />
          <Field label="Função" name="role" defaultValue={editingProfessional?.role} />
          <Field
            label="Comissão %"
            name="commission_percentage"
            type="number"
            defaultValue={String(editingProfessional?.commission_percentage ?? "")}
            required
          />
          <label className="flex items-end gap-2 rounded-md border border-stone-200 px-3 py-2.5 text-sm text-stone-700">
            <input
              name="active"
              type="checkbox"
              defaultChecked={editingProfessional?.active ?? true}
              className="h-4 w-4 rounded border-stone-300 text-blush"
            />
            Ativo
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-500">{status}</p>
          <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white hover:bg-blush/90">
            <Save className="h-4 w-4" />
            {editingProfessional ? "Atualizar profissional" : "Guardar profissional"}
          </button>
        </div>
      </form>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Equipa do salão</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-400">
              <tr>
                <th className="py-2 font-semibold">Nome</th>
                <th className="py-2 font-semibold">Função</th>
                <th className="py-2 font-semibold">Contacto</th>
                <th className="py-2 text-right font-semibold">Comissão</th>
                <th className="py-2 font-semibold">Estado</th>
                <th className="py-2 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {professionals.map((professional) => (
                <tr key={professional.id}>
                  <td className="py-3 font-medium text-ink">{professional.name}</td>
                  <td className="py-3 text-stone-600">{professional.role || "Sem função"}</td>
                  <td className="py-3 text-stone-600">{professional.phone || professional.email || "Sem contacto"}</td>
                  <td className="py-3 text-right font-medium text-ink">{Number(professional.commission_percentage)}%</td>
                  <td className="py-3">
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${professional.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
                      {professional.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProfessional(professional);
                          setStatus("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-ink hover:bg-champagne"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeactivate(professional)}
                        className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        disabled={!professional.active}
                      >
                        <UserMinus className="h-4 w-4" />
                        Desativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Relatório de comissões</h2>
            <p className="mt-1 text-sm text-stone-500">Resumo por profissional no mês selecionado.</p>
          </div>
          <label className="text-sm font-medium text-stone-700">
            Mês
            <input
              className="focus-ring ml-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
              type="month"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-400">
              <tr>
                <th className="py-2 font-semibold">Profissional</th>
                <th className="py-2 text-right font-semibold">Total faturado</th>
                <th className="py-2 text-right font-semibold">Comissão %</th>
                <th className="py-2 text-right font-semibold">Valor comissão</th>
                <th className="py-2 text-right font-semibold">Valor salão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {commissionReport.map((item) => (
                <tr key={item.professional.id}>
                  <td className="py-3 font-medium text-ink">{item.professional.name}</td>
                  <td className="py-3 text-right text-stone-600">{currency.format(item.totalRevenue)}</td>
                  <td className="py-3 text-right text-stone-600">{item.commissionPercentage}%</td>
                  <td className="py-3 text-right font-medium text-ink">{currency.format(item.commissionValue)}</td>
                  <td className="py-3 text-right font-medium text-ink">{currency.format(item.salonValue)}</td>
                </tr>
              ))}
              <tr className="bg-champagne/40 font-semibold text-ink">
                <td className="py-3">Total</td>
                <td className="py-3 text-right">{currency.format(totals.revenue)}</td>
                <td className="py-3 text-right">-</td>
                <td className="py-3 text-right">{currency.format(totals.commissions)}</td>
                <td className="py-3 text-right">{currency.format(totals.salon)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function upsertProfessional(current: Professional[], professional: Professional) {
  const exists = current.some((item) => item.id === professional.id);
  if (exists) return current.map((item) => (item.id === professional.id ? professional : item));
  return [...current, professional].sort((a, b) => a.name.localeCompare(b.name, "pt-PT"));
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
  defaultValue?: string | number | null;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        required={required}
      />
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
