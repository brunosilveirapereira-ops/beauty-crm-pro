"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Eye, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { CustomerForm } from "@/components/customer-form";
import { deletedCustomersStorageKey, localCustomersStorageKey, mergeById } from "@/lib/risk";
import { isSupabaseConfigured } from "@/lib/supabase";
import { openWhatsappWithFallback, whatsappRecoveryLinks } from "@/lib/whatsapp";
import type { Customer } from "@/lib/types";

export function CustomerManager({ initialCustomers }: { initialCustomers: Customer[] }) {
  const router = useRouter();
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [deletedCustomerIds, setDeletedCustomerIds] = useState<string[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteStatus, setDeleteStatus] = useState("");
  const [storageLoaded, setStorageLoaded] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Supabase conectado: ignorando localStorage de clientes.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: lendo clientes do localStorage.");

    const saved = window.localStorage.getItem(localCustomersStorageKey);
    setDeletedCustomerIds(readDeletedCustomerIds());
    if (!saved) {
      setStorageLoaded(true);
      return;
    }

    try {
      setLocalCustomers(JSON.parse(saved) as Customer[]);
    } catch {
      window.localStorage.removeItem(localCustomersStorageKey);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured || !storageLoaded) return;
    window.localStorage.setItem(localCustomersStorageKey, JSON.stringify(localCustomers));
    window.localStorage.setItem(deletedCustomersStorageKey, JSON.stringify(deletedCustomerIds));
  }, [deletedCustomerIds, localCustomers, storageLoaded]);

  const customers = useMemo(() => {
    return mergeById(localCustomers, initialCustomers, deletedCustomerIds);
  }, [deletedCustomerIds, initialCustomers, localCustomers]);

  function handleCustomerSaved(customer: Customer) {
    setLocalCustomers((current) => {
      const exists = current.some((item) => item.id === customer.id);
      if (exists) return current.map((item) => (item.id === customer.id ? customer : item));
      return [customer, ...current];
    });
    setDeletedCustomerIds((current) => current.filter((id) => id !== customer.id));
    setEditingCustomer(null);
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Apagar ${customer.name}? Esta acao nao pode ser anulada.`);
    if (!confirmed) return;

    if (isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Supabase conectado: apagando cliente de public.customers.", {
        customerId: customer.id
      });
      const supabase = createClientComponentClient();
      const { error } = await supabase.from("customers").delete().eq("id", customer.id);

      if (error) {
        console.error("[Beauty CRM Pro] Erro ao apagar cliente no Supabase:", error);
        setDeleteStatus(error.message);
        return;
      }
    } else {
      console.info("[Beauty CRM Pro] Modo local: apagando cliente do localStorage.", {
        customerId: customer.id
      });
    }

    setLocalCustomers((current) => current.filter((item) => item.id !== customer.id));
    setDeletedCustomerIds((current) => (current.includes(customer.id) ? current : [...current, customer.id]));
    if (editingCustomer?.id === customer.id) setEditingCustomer(null);
    setDeleteStatus("Cliente apagado com sucesso.");
    router.refresh();
  }

  return (
    <>
      <CustomerForm
        editingCustomer={editingCustomer}
        onCancelEdit={() => setEditingCustomer(null)}
        onCustomerSaved={handleCustomerSaved}
      />

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink">Carteira de clientes</h2>
          {deleteStatus ? <p className="text-sm text-stone-500">{deleteStatus}</p> : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-400">
              <tr>
                <th className="py-2 font-semibold">Nome</th>
                <th className="py-2 font-semibold">WhatsApp</th>
                <th className="py-2 font-semibold">Instagram</th>
                <th className="py-2 font-semibold">Nascimento</th>
                <th className="py-2 font-semibold">Ultima visita</th>
                <th className="py-2 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {customers.map((customer) => {
                const customerRoute = `/clientes/${customer.id}` as Route;
                const whatsappLinks = whatsappRecoveryLinks(customer);

                return (
                  <tr key={customer.id}>
                    <td className="py-3 font-medium text-ink">
                      <Link className="hover:text-blush hover:underline" href={customerRoute}>
                        {customer.name}
                      </Link>
                    </td>
                    <td className="py-3 text-stone-600">{customer.whatsapp}</td>
                    <td className="py-3 text-stone-600">{customer.instagram}</td>
                    <td className="py-3 text-stone-600">{customer.birth_date}</td>
                    <td className="py-3 text-stone-600">{customer.last_visit}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={customerRoute}
                          className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-ink hover:bg-champagne"
                        >
                          <Eye className="h-4 w-4" />
                          Ver ficha
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setDeleteStatus("");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-ink hover:bg-champagne"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer)}
                          className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Apagar
                        </button>
                        <a
                          href={whatsappLinks.webUrl}
                          onClick={(event) => {
                            event.preventDefault();
                            openWhatsappWithFallback(whatsappLinks.appUrl, whatsappLinks.webUrl);
                          }}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-ink hover:bg-champagne"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function readDeletedCustomerIds() {
  const saved = window.localStorage.getItem(deletedCustomersStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as string[];
  } catch {
    window.localStorage.removeItem(deletedCustomersStorageKey);
    return [];
  }
}
