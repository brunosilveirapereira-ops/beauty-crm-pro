import Link from "next/link";
import { Gem } from "lucide-react";
import { AdminSetupForm } from "@/components/admin-setup-form";

export default function SetupAdminPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
            <Gem className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">Criar primeiro admin</h1>
            <p className="text-sm text-stone-500">Beauty CRM Pro</p>
          </div>
        </div>
        <AdminSetupForm />
        <Link className="mt-4 block text-center text-sm font-medium text-stone-600 hover:text-ink" href="/login">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
