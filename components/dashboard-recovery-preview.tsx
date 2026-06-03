"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildAtRiskCustomers,
  deletedCustomersStorageKey,
  localCustomersStorageKey,
  localServicesStorageKey,
  mergeById
} from "@/lib/risk";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Customer, ServiceHistory } from "@/lib/types";

export function DashboardRecoveryPreview({
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
      console.info("[Beauty CRM Pro] Supabase conectado: recuperacao prioritaria calculada com dados do Supabase.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: recuperacao prioritaria calculada com localStorage/demo.");

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

  const atRisk = useMemo(() => {
    const customers = mergeById(localCustomers, initialCustomers, deletedCustomerIds);
    const services = mergeById(localServices, initialServices);
    return buildAtRiskCustomers(customers, services).slice(0, 4);
  }, [deletedCustomerIds, initialCustomers, initialServices, localCustomers, localServices]);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Recuperacao prioritaria</h2>
      <div className="mt-4 space-y-3">
        {atRisk.map(({ customer, daysWithoutVisit, risk }) => (
          <div key={customer.id} className="flex items-center justify-between gap-3 rounded-md bg-champagne/70 px-3 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{customer.name}</p>
              <p className="text-xs text-stone-500">{daysWithoutVisit} dias sem visita</p>
            </div>
            <span className={`rounded-md border px-2 py-1 text-xs font-medium ${risk.className}`}>{risk.label}</span>
          </div>
        ))}
      </div>
    </div>
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
