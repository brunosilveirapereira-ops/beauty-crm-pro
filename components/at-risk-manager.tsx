"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  buildAtRiskCustomers,
  deletedCustomersStorageKey,
  localCustomersStorageKey,
  localServicesStorageKey,
  mergeById
} from "@/lib/risk";
import { isSupabaseConfigured } from "@/lib/supabase";
import { whatsappRecoveryUrl } from "@/lib/whatsapp";
import type { Customer, ServiceHistory } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export function AtRiskManager({
  initialCustomers,
  initialServices
}: {
  initialCustomers: Customer[];
  initialServices: ServiceHistory[];
}) {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [localServices, setLocalServices] = useState<ServiceHistory[]>([]);
  const [deletedCustomerIds, setDeletedCustomerIds] = useState<string[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Supabase conectado: clientes em risco calculados com dados do Supabase.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: clientes em risco calculados com localStorage/demo.");

    function loadLocalData() {
      setLocalCustomers(readStoredItems<Customer>(localCustomersStorageKey));
      setLocalServices(readStoredItems<ServiceHistory>(localServicesStorageKey));
      setDeletedCustomerIds(readStoredItems<string>(deletedCustomersStorageKey));
    }

    loadLocalData();
    window.addEventListener("storage", loadLocalData);
    window.addEventListener("focus", loadLocalData);

    return () => {
      window.removeEventListener("storage", loadLocalData);
      window.removeEventListener("focus", loadLocalData);
    };
  }, []);

  const atRiskCustomers = useMemo(() => {
    const customers = mergeById(localCustomers, initialCustomers, deletedCustomerIds);
    const services = mergeById(localServices, initialServices);
    return buildAtRiskCustomers(customers, services);
  }, [deletedCustomerIds, initialCustomers, initialServices, localCustomers, localServices]);

  if (atRiskCustomers.length === 0) {
    return <EmptyState icon={MessageCircle} title="Sem clientes em risco" text="Quando alguem ultrapassar 60 dias sem visitar, aparece aqui." />;
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-stone-400">
            <tr>
              <th className="py-2 font-semibold">Nome</th>
              <th className="py-2 font-semibold">Telefone</th>
              <th className="py-2 font-semibold">Dias sem visita</th>
              <th className="py-2 font-semibold">Ultimo servico</th>
              <th className="py-2 text-right font-semibold">Valor medio</th>
              <th className="py-2 font-semibold">Indicador</th>
              <th className="py-2 text-right font-semibold">Contacto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {atRiskCustomers.map(({ customer, daysWithoutVisit, lastService, averageSpent, risk }) => (
              <tr key={customer.id}>
                <td className="py-3 font-medium text-ink">{customer.name}</td>
                <td className="py-3 text-stone-600">{customer.whatsapp || customer.phone}</td>
                <td className="py-3 text-stone-600">{daysWithoutVisit} dias</td>
                <td className="py-3 text-stone-600">{lastService?.service ?? "Sem servico registado"}</td>
                <td className="py-3 text-right font-medium text-ink">{currency.format(averageSpent)}</td>
                <td className="py-3">
                  <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${risk.className}`}>
                    {risk.label}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <a
                    href={whatsappRecoveryUrl(customer)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-sage px-3 py-2 text-xs font-semibold text-white hover:bg-sage/90"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar WhatsApp
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function readStoredItems<T>(key: string) {
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as T[];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}
