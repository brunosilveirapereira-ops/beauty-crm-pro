import { demoCustomers, demoServices } from "./mock-data";
import { daysSince, isAtRisk } from "./risk";
import { getSupabaseServerClient } from "./supabase-server";
import { isSupabaseConfigured } from "./supabase";
import type { Customer, DashboardStats, ServiceHistory } from "./types";

export { daysSince, isAtRisk };

export async function getCustomers(): Promise<Customer[]> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: lendo clientes demo.");
    return demoCustomers;
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo clientes de public.customers.");

  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler clientes do Supabase:", error);
    return [];
  }

  return data as Customer[];
}

export async function getServices(): Promise<ServiceHistory[]> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: lendo servicos demo.");
    return demoServices;
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo servicos de public.service_history.");

  const { data, error } = await supabase
    .from("service_history")
    .select("*, customer:customers(id, name, whatsapp)")
    .order("date", { ascending: false });

  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler servicos do Supabase:", error);
    return [];
  }

  return data as ServiceHistory[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const customers = await getCustomers();
  const services = await getServices();
  const today = new Date();
  const currentMonth = today.getUTCMonth() + 1;
  const currentYear = today.getUTCFullYear();

  return {
    totalCustomers: customers.length,
    atRiskCustomers: customers.filter(isAtRisk).length,
    monthlyBirthdays: customers.filter((customer) => {
      if (!customer.birth_date) return false;
      return new Date(`${customer.birth_date}T12:00:00Z`).getUTCMonth() + 1 === currentMonth;
    }).length,
    monthlyRevenue: services
      .filter((service) => {
        const date = new Date(`${service.date}T12:00:00Z`);
        return date.getUTCMonth() + 1 === currentMonth && date.getUTCFullYear() === currentYear;
      })
      .reduce((sum, service) => sum + Number(service.value), 0)
  };
}
