import { AppShell } from "@/components/app-shell";
import { CustomerManager } from "@/components/customer-manager";
import { PageHeader } from "@/components/page-header";
import { getCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <AppShell>
      <PageHeader title="Clientes" description="Cadastre dados de contacto, preferencias e ultima visita." />
      <CustomerManager initialCustomers={customers} />
    </AppShell>
  );
}
