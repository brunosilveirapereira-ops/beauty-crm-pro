"use client";

import { useEffect, useMemo, useState } from "react";
import { ServiceForm } from "@/components/service-form";
import { deletedCustomersStorageKey, localCustomersStorageKey, localServicesStorageKey, mergeById } from "@/lib/risk";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Customer, ServiceHistory } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export function ServiceManager({
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
      console.info("[Beauty CRM Pro] Supabase conectado: ignorando localStorage de servicos.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: lendo clientes/servicos do localStorage.");
    setLocalCustomers(readStoredItems<Customer>(localCustomersStorageKey));
    setLocalServices(readStoredItems<ServiceHistory>(localServicesStorageKey));
    setDeletedCustomerIds(readStoredItems<string>(deletedCustomersStorageKey));
  }, []);

  const customers = useMemo(() => mergeById(localCustomers, initialCustomers, deletedCustomerIds), [deletedCustomerIds, initialCustomers, localCustomers]);
  const services = useMemo(() => mergeById(localServices, initialServices), [initialServices, localServices]);

  function handleServiceSaved(service: ServiceHistory) {
    setLocalServices((current) => [service, ...current]);
  }

  return (
    <>
      <ServiceForm customers={customers} onServiceSaved={handleServiceSaved} />

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">Atendimentos registados</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase text-stone-400">
              <tr>
                <th className="py-2 font-semibold">Data</th>
                <th className="py-2 font-semibold">Cliente</th>
                <th className="py-2 font-semibold">Servico</th>
                <th className="py-2 font-semibold">Profissional</th>
                <th className="py-2 font-semibold">Formula/produtos</th>
                <th className="py-2 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {services.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-stone-600">{item.date}</td>
                  <td className="py-3 font-medium text-ink">{item.customer?.name ?? customers.find((customer) => customer.id === item.customer_id)?.name ?? "Cliente"}</td>
                  <td className="py-3 text-stone-600">{item.service}</td>
                  <td className="py-3 text-stone-600">{item.professional}</td>
                  <td className="max-w-xs truncate py-3 text-stone-600">{item.formula_products}</td>
                  <td className="py-3 text-right font-medium text-ink">{currency.format(Number(item.value))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
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
