"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, CalendarDays, CircleDollarSign, HeartPulse, Landmark, UsersRound } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { calculateMonthlyCommissionSummary, getCurrentMonthKey } from "@/lib/commissions";
import { localProfessionalsStorageKey } from "@/components/professionals-manager";
import {
  buildAtRiskCustomers,
  deletedCustomersStorageKey,
  localCustomersStorageKey,
  localServicesStorageKey,
  mergeById
} from "@/lib/risk";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Customer, Professional, ServiceHistory } from "@/lib/types";

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export function DashboardStatsGrid({
  initialCustomers,
  initialProfessionals,
  initialServices
}: {
  initialCustomers: Customer[];
  initialProfessionals: Professional[];
  initialServices: ServiceHistory[];
}) {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [localServices, setLocalServices] = useState<ServiceHistory[]>([]);
  const [localProfessionals, setLocalProfessionals] = useState<Professional[]>([]);
  const [deletedCustomerIds, setDeletedCustomerIds] = useState<string[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Supabase conectado: indicadores calculados com dados do Supabase.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: indicadores calculados com localStorage/demo.");

    function loadLocalData() {
      setLocalCustomers(readStoredItems<Customer>(localCustomersStorageKey));
      setLocalServices(readStoredItems<ServiceHistory>(localServicesStorageKey));
      setLocalProfessionals(readStoredItems<Professional>(localProfessionalsStorageKey));
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

  const stats = useMemo(() => {
    const customers = mergeById(localCustomers, initialCustomers, deletedCustomerIds);
    const services = mergeById(localServices, initialServices);
    const professionals = mergeById(localProfessionals, initialProfessionals);
    const today = new Date();
    const currentMonth = today.getUTCMonth() + 1;
    const currentYear = today.getUTCFullYear();
    const commissionSummary = calculateMonthlyCommissionSummary(professionals, services, getCurrentMonthKey(today));

    return {
      totalCustomers: customers.length,
      atRiskCustomers: buildAtRiskCustomers(customers, services).length,
      monthlyBirthdays: customers.filter((customer) => {
        if (!customer.birth_date) return false;
        return new Date(`${customer.birth_date}T12:00:00Z`).getUTCMonth() + 1 === currentMonth;
      }).length,
      monthlyRevenue: services
        .filter((service) => {
          const date = new Date(`${service.date}T12:00:00Z`);
          return date.getUTCMonth() + 1 === currentMonth && date.getUTCFullYear() === currentYear;
        })
        .reduce((sum, service) => sum + Number(service.value), 0),
      monthlyCommissions: commissionSummary.monthlyCommissions,
      monthlySalonNet: commissionSummary.monthlySalonNet
    };
  }, [deletedCustomerIds, initialCustomers, initialProfessionals, initialServices, localCustomers, localProfessionals, localServices]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total de clientes" value={String(stats.totalCustomers)} detail="Clientes cadastrados no CRM" icon={UsersRound} />
      <StatCard label="Clientes em risco" value={String(stats.atRiskCustomers)} detail="Sem visita ha mais de 60 dias" icon={HeartPulse} />
      <StatCard label="Aniversarios do mes" value={String(stats.monthlyBirthdays)} detail="Oportunidades para mimo e retorno" icon={CalendarDays} />
      <StatCard label="Faturacao mensal" value={currency.format(stats.monthlyRevenue)} detail="Servicos registados este mes" icon={CircleDollarSign} />
      <StatCard label="Comissoes do mes" value={currency.format(stats.monthlyCommissions)} detail="Estimativa com base nas percentagens" icon={BadgePercent} />
      <StatCard label="Liquido estimado" value={currency.format(stats.monthlySalonNet)} detail="Faturacao menos comissoes" icon={Landmark} />
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
