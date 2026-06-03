import { dataMode, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default function DebugEnvPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-ink">
      <section className="mx-auto max-w-3xl rounded-lg border border-stone-200 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Debug Supabase Env</h1>
        <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
          <Row label="Supabase URL detectada" value={supabaseUrl || "Nao detectada"} />
          <Row label="Anon key detectada" value={supabaseAnonKey ? "sim" : "nao"} />
          <Row label="Anon key tamanho" value={String(supabaseAnonKey?.length ?? 0)} />
          <Row label="Modo atual" value={dataMode === "supabase" ? "Supabase" : "Local"} />
          <Row label="Supabase configurado" value={isSupabaseConfigured ? "sim" : "nao"} />
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-b border-stone-100 px-4 py-3 last:border-b-0 sm:grid-cols-[220px_1fr]">
      <span className="text-sm font-medium text-stone-500">{label}</span>
      <span className="break-all text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
