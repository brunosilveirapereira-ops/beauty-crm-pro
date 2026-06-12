import type { CommissionReportItem, Professional, ServiceHistory } from "./types";

export function getCurrentMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function filterServicesByMonth(services: ServiceHistory[], monthKey: string) {
  return services.filter((service) => service.date.startsWith(monthKey));
}

export function buildCommissionReport(professionals: Professional[], services: ServiceHistory[], monthKey: string): CommissionReportItem[] {
  const monthServices = filterServicesByMonth(services, monthKey);

  return professionals
    .map((professional) => {
      const professionalServices = monthServices.filter((service) => serviceBelongsToProfessional(service, professional));
      const totalRevenue = professionalServices.reduce((sum, service) => sum + Number(service.value), 0);
      const commissionPercentage = Number(professional.commission_percentage || 0);
      const commissionValue = totalRevenue * (commissionPercentage / 100);

      return {
        professional,
        totalRevenue,
        commissionPercentage,
        commissionValue,
        salonValue: totalRevenue - commissionValue
      };
    })
    .filter((item) => item.totalRevenue > 0 || item.professional.active)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function calculateMonthlyCommissionSummary(professionals: Professional[], services: ServiceHistory[], monthKey: string) {
  const report = buildCommissionReport(professionals, services, monthKey);
  const monthlyRevenue = filterServicesByMonth(services, monthKey).reduce((sum, service) => sum + Number(service.value), 0);
  const monthlyCommissions = report.reduce((sum, item) => sum + item.commissionValue, 0);

  return {
    monthlyRevenue,
    monthlyCommissions,
    monthlySalonNet: monthlyRevenue - monthlyCommissions
  };
}

function serviceBelongsToProfessional(service: ServiceHistory, professional: Professional) {
  if (service.professional_id && service.professional_id === professional.id) return true;
  return normalizeName(service.professional) === normalizeName(professional.name);
}

function normalizeName(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("pt-PT") ?? "";
}
