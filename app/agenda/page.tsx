import { AppShell } from "@/components/app-shell";
import { AgendaManager } from "@/components/agenda-manager";
import { PageHeader } from "@/components/page-header";
import { getAppointmentsByDate, getCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [customers, appointments] = await Promise.all([getCustomers(), getAppointmentsByDate(today)]);

  return (
    <AppShell>
      <PageHeader title="Agenda" description="Marcações diárias do salão, das 08:00 às 20:00." />
      <AgendaManager customers={customers} initialAppointments={appointments} initialDate={today} />
    </AppShell>
  );
}
