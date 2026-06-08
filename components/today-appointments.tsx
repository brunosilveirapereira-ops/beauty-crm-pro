import type { Appointment } from "@/lib/types";

export function TodayAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Próximas marcações do dia</h2>
      <div className="mt-4 space-y-3">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="rounded-md bg-champagne/70 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">{appointment.customer?.name ?? "Cliente"}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {appointment.service} · {appointment.professional}
                </p>
              </div>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-blush">{appointment.appointment_time.slice(0, 5)}</span>
            </div>
          </div>
        ))}
        {appointments.length === 0 ? <p className="rounded-md border border-dashed border-stone-200 px-3 py-6 text-center text-sm text-stone-500">Sem marcações para hoje.</p> : null}
      </div>
    </div>
  );
}
