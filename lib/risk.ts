import type { Customer, ServiceHistory } from "./types";

export const localCustomersStorageKey = "beauty-crm-pro-customers";
export const deletedCustomersStorageKey = "beauty-crm-pro-deleted-customers";
export const localServicesStorageKey = "beauty-crm-pro-services";

export type RiskLevel = {
  label: "Médio Risco" | "Alto Risco" | "Crítico";
  className: string;
};

export type AtRiskCustomer = {
  customer: Customer;
  daysWithoutVisit: number;
  lastService: ServiceHistory | null;
  averageSpent: number;
  risk: RiskLevel;
};

export function daysSince(date: string | null) {
  if (!date) return 0;
  const today = new Date();
  const diff = today.getTime() - new Date(`${date}T12:00:00Z`).getTime();
  return Math.floor(diff / 86400000);
}

export function isAtRisk(customer: Pick<Customer, "last_visit">) {
  return Boolean(customer.last_visit) && daysSince(customer.last_visit) > 60;
}

export function getRiskLevel(daysWithoutVisit: number): RiskLevel {
  if (daysWithoutVisit >= 120) {
    return {
      label: "Crítico",
      className: "bg-red-50 text-red-700 border-red-200"
    };
  }

  if (daysWithoutVisit >= 90) {
    return {
      label: "Alto Risco",
      className: "bg-amber-50 text-amber-700 border-amber-200"
    };
  }

  return {
    label: "Médio Risco",
    className: "bg-champagne text-blush border-champagne"
  };
}

export function buildAtRiskCustomers(customers: Customer[], services: ServiceHistory[]) {
  return customers
    .map((customer): AtRiskCustomer | null => {
      const daysWithoutVisit = daysSince(customer.last_visit);
      if (!customer.last_visit || daysWithoutVisit <= 60) return null;

      const customerServices = services
        .filter((service) => service.customer_id === customer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const averageSpent =
        customerServices.length === 0
          ? 0
          : customerServices.reduce((sum, service) => sum + Number(service.value), 0) / customerServices.length;

      return {
        customer,
        daysWithoutVisit,
        lastService: customerServices[0] ?? null,
        averageSpent,
        risk: getRiskLevel(daysWithoutVisit)
      };
    })
    .filter((item): item is AtRiskCustomer => Boolean(item))
    .sort((a, b) => b.daysWithoutVisit - a.daysWithoutVisit);
}

export function mergeById<T extends { id: string }>(localItems: T[], initialItems: T[], deletedIds: string[] = []) {
  const localIds = new Set(localItems.map((item) => item.id));
  const deleted = new Set(deletedIds);
  return [
    ...localItems.filter((item) => !deleted.has(item.id)),
    ...initialItems.filter((item) => !localIds.has(item.id) && !deleted.has(item.id))
  ];
}
