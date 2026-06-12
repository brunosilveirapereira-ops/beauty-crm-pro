import { calculateMonthlyCommissionSummary, getCurrentMonthKey } from "./commissions";
import { demoCustomers, demoProfessionals, demoServices } from "./mock-data";
import { daysSince, isAtRisk } from "./risk";
import { getSupabaseServerClient } from "./supabase-server";
import { isSupabaseConfigured } from "./supabase";
import type { Appointment, ColorHistory, Customer, DashboardStats, Professional, ServiceHistory, VisitHistory } from "./types";

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

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: lendo cliente demo.");
    return demoCustomers.find((customer) => customer.id === customerId) ?? null;
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo cliente de public.customers.", { customerId });

  const { data, error } = await supabase.from("customers").select("*").eq("id", customerId).single();
  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler cliente do Supabase:", error);
    return null;
  }

  return data as Customer;
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
    .select("*, customer:customers(id, name, whatsapp), professional_profile:professionals(id, name, commission_percentage, active)")
    .order("date", { ascending: false });

  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler servicos do Supabase:", error);
    return [];
  }

  return data as ServiceHistory[];
}

export async function getProfessionals(): Promise<Professional[]> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: lendo profissionais demo.");
    return demoProfessionals;
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo profissionais de public.professionals.");

  const { data, error } = await supabase.from("professionals").select("*").order("name", { ascending: true });
  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler profissionais do Supabase:", error);
    return [];
  }

  return data as Professional[];
}

export async function getVisitHistory(customerId: string): Promise<VisitHistory[]> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: lendo historico de visitas demo via service_history.");
    return demoServices.filter((service) => service.customer_id === customerId);
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo visitas de public.service_history.", { customerId });

  const { data, error } = await supabase
    .from("service_history")
    .select("*, professional_profile:professionals(id, name, commission_percentage, active)")
    .eq("customer_id", customerId)
    .order("date", { ascending: false });

  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler historico de visitas em service_history:", error);
    return [];
  }

  return data as VisitHistory[];
}

export async function getColorHistory(customerId: string): Promise<ColorHistory[]> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: sem historico de coloracao Supabase.");
    return [];
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo coloracoes de public.color_history.", { customerId });

  const { data, error } = await supabase
    .from("color_history")
    .select("*")
    .eq("customer_id", customerId)
    .order("color_date", { ascending: false });

  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler historico de coloracao no Supabase:", error);
    return [];
  }

  return data as ColorHistory[];
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const supabase = getSupabaseServerClient();
  if (!isSupabaseConfigured || !supabase) {
    console.info("[Beauty CRM Pro] Modo local: sem agenda Supabase.");
    return [];
  }

  console.info("[Beauty CRM Pro] Supabase conectado: lendo agenda de public.appointments.", { date });

  const { data, error } = await supabase
    .from("appointments")
    .select("*, customer:customers(id, name, phone, whatsapp)")
    .eq("appointment_date", date)
    .order("appointment_time", { ascending: true });

  if (error) {
    console.error("[Beauty CRM Pro] Erro ao ler agenda no Supabase:", error);
    return [];
  }

  return data as Appointment[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const customers = await getCustomers();
  const services = await getServices();
  const professionals = await getProfessionals();
  const today = new Date();
  const currentMonth = today.getUTCMonth() + 1;
  const currentYear = today.getUTCFullYear();
  const commissionSummary = calculateMonthlyCommissionSummary(professionals, services, getCurrentMonthKey(today));

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
      .reduce((sum, service) => sum + Number(service.value), 0),
    monthlyCommissions: commissionSummary.monthlyCommissions,
    monthlySalonNet: commissionSummary.monthlySalonNet
  };
}
