import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ServiceManager } from "@/components/service-manager";
import { getCustomers, getProfessionals, getServices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [customers, professionals, services] = await Promise.all([getCustomers(), getProfessionals(), getServices()]);

  return (
    <AppShell>
      <PageHeader title="Historico de servicos" description="Registe servicos, profissionais, valores e formulas usadas em cada atendimento." />
      <ServiceManager initialCustomers={customers} initialProfessionals={professionals} initialServices={services} />
    </AppShell>
  );
}
