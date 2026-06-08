import { AppShell } from "@/components/app-shell";
import { DashboardRecoveryPreview } from "@/components/dashboard-recovery-preview";
import { DashboardStatsGrid } from "@/components/dashboard-stats-grid";
import { DataModeIndicator } from "@/components/data-mode-indicator";
import { PageHeader } from "@/components/page-header";
import { TodayAppointments } from "@/components/today-appointments";
import { getAppointmentsByDate, getCustomers, getServices } from "@/lib/data";

const currency = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [customers, services, appointments] = await Promise.all([getCustomers(), getServices(), getAppointmentsByDate(today)]);
  const recentServices = services.slice(0, 5);
  const upcomingAppointments = appointments.filter((appointment) => appointment.appointment_time.slice(0, 5) >= new Date().toTimeString().slice(0, 5)).slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Visao rapida da carteira de clientes, aniversarios e receita do mes."
        action={<DataModeIndicator />}
      />

      <DashboardStatsGrid initialCustomers={customers} initialServices={services} />

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Servicos recentes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-400">
                <tr>
                  <th className="py-2 font-semibold">Cliente</th>
                  <th className="py-2 font-semibold">Servico</th>
                  <th className="py-2 font-semibold">Profissional</th>
                  <th className="py-2 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentServices.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-ink">{item.customer?.name ?? "Cliente"}</td>
                    <td className="py-3 text-stone-600">{item.service}</td>
                    <td className="py-3 text-stone-600">{item.professional}</td>
                    <td className="py-3 text-right font-medium text-ink">{currency.format(Number(item.value))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DashboardRecoveryPreview initialCustomers={customers} initialServices={services} />
      </section>

      <section className="mt-6">
        <TodayAppointments appointments={upcomingAppointments} />
      </section>
    </AppShell>
  );
}
