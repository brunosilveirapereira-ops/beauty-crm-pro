import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ServiceManager } from "@/components/service-manager";
import { getCustomers, getServices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [customers, services] = await Promise.all([getCustomers(), getServices()]);

  return (
    <AppShell>
      <PageHeader title="Historico de servicos" description="Registe servicos, profissionais, valores e formulas usadas em cada atendimento." />
      <ServiceManager initialCustomers={customers} initialServices={services} />
    </AppShell>
  );
}
