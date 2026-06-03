import { AppShell } from "@/components/app-shell";
import { AtRiskManager } from "@/components/at-risk-manager";
import { PageHeader } from "@/components/page-header";
import { getCustomers, getServices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AtRiskCustomersPage() {
  const [customers, services] = await Promise.all([getCustomers(), getServices()]);

  return (
    <AppShell>
      <PageHeader title="Clientes em risco" description="Clientes sem visita ha mais de 60 dias, organizados por prioridade de recuperacao." />
      <AtRiskManager initialCustomers={customers} initialServices={services} />
    </AppShell>
  );
}
