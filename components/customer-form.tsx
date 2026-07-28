"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createCustomer, updateCustomer } from "@/lib/customer-actions";
import { isDevMode, isSupabaseConfigured } from "@/lib/supabase";
import type { Customer } from "@/lib/types";

type CustomerPayload = Omit<Customer, "id" | "created_at">;

export function CustomerForm({
  editingCustomer,
  onCancelEdit,
  onCustomerSaved
}: {
  editingCustomer: Customer | null;
  onCancelEdit: () => void;
  onCustomerSaved: (customer: Customer) => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("");
  const isEditing = Boolean(editingCustomer);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    if (!editingCustomer) {
      form.reset();
      return;
    }

    setFieldValue(form, "name", editingCustomer.name);
    setFieldValue(form, "phone", editingCustomer.phone);
    setFieldValue(form, "whatsapp", editingCustomer.whatsapp);
    setFieldValue(form, "instagram", editingCustomer.instagram);
    setFieldValue(form, "birth_date", editingCustomer.birth_date);
    setFieldValue(form, "last_visit", editingCustomer.last_visit);
    setFieldValue(form, "notes", editingCustomer.notes);
    setStatus("");
  }, [editingCustomer]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const payload: CustomerPayload = {
      name: String(form.get("name")),
      phone: String(form.get("phone") || "") || null,
      whatsapp: String(form.get("whatsapp") || "") || null,
      instagram: String(form.get("instagram") || "") || null,
      birth_date: String(form.get("birth_date") || "") || null,
      last_visit: String(form.get("last_visit") || "") || null,
      notes: String(form.get("notes") || "") || null
    };

    if (!isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Modo local: guardando cliente em localStorage.");
      const localCustomer: Customer = {
        ...payload,
        id: editingCustomer?.id ?? `local-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        created_at: editingCustomer?.created_at ?? new Date().toISOString()
      };

      onCustomerSaved(localCustomer);
      setStatus(isEditing ? "Cliente atualizado com sucesso." : "Cliente guardado com sucesso.");
      formElement.reset();
      onCancelEdit();
      return;
    }

    if (isEditing) {
      const editingCustomerId = editingCustomer?.id;
      if (!editingCustomerId) {
        setStatus("Nao foi possivel identificar o cliente para atualizar.");
        return;
      }

      // Edicao: o salon_id e resolvido e validado no servidor (updateCustomer),
      // nunca no browser — o update filtra sempre por id E salon_id, nunca so por id.
      console.info("[Beauty CRM Pro] Supabase conectado: gravando cliente em public.customers.", {
        action: "update",
        customerId: editingCustomerId,
        devMode: isDevMode,
        table: "customers",
        payload
      });

      const result = await updateCustomer(editingCustomerId, payload);

      if (result.error !== null) {
        console.error("[Beauty CRM Pro] Erro ao gravar cliente no Supabase:", {
          action: "update",
          table: "customers",
          devMode: isDevMode,
          payload,
          error: result.error
        });
        setStatus(result.error);
        return;
      }

      onCustomerSaved(result.data);
      setStatus("Cliente atualizado com sucesso.");
      formElement.reset();
      onCancelEdit();
      router.refresh();
      return;
    }

    // Criacao: o salon_id e resolvido e validado no servidor (createCustomer),
    // nunca no browser — garante que nunca existe um insert sem salon_id.
    console.info("[Beauty CRM Pro] Supabase conectado: gravando cliente em public.customers.", {
      action: "insert",
      devMode: isDevMode,
      table: "customers",
      payload
    });

    const result = await createCustomer(payload);

    if (result.error !== null) {
      console.error("[Beauty CRM Pro] Erro ao gravar cliente no Supabase:", {
        action: "insert",
        table: "customers",
        devMode: isDevMode,
        payload,
        error: result.error
      });
      setStatus(result.error);
      return;
    }

    onCustomerSaved(result.data);
    setStatus("Cliente guardado com sucesso.");
    formElement.reset();
    onCancelEdit();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" name="name" required />
        <Field label="Telefone" name="phone" type="tel" />
        <Field label="WhatsApp" name="whatsapp" type="tel" />
        <Field label="Instagram" name="instagram" placeholder="@cliente" />
        <Field label="Data de nascimento" name="birth_date" type="date" />
        <Field label="Ultima visita" name="last_visit" type="date" />
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
        <div className="flex flex-col gap-2 sm:flex-row">
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                formRef.current?.reset();
                onCancelEdit();
                setStatus("");
              }}
              className="rounded-md border border-stone-200 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-champagne"
            >
              Cancelar
            </button>
          ) : null}
          <button className="flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white hover:bg-blush/90">
            <Save className="h-4 w-4" />
            {isEditing ? "Atualizar cliente" : "Guardar cliente"}
          </button>
        </div>
      </div>
    </form>
  );
}

function setFieldValue(form: HTMLFormElement, name: string, value: string | null) {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    field.value = value ?? "";
  }
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
