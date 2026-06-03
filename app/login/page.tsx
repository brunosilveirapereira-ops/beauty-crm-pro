import { Gem } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
            <Gem className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">Beauty CRM Pro</h1>
            <p className="text-sm text-stone-500">Acesso do salao</p>
          </div>
        </div>
        <LoginForm />
        <Link className="mt-4 block text-center text-sm font-medium text-stone-600 hover:text-ink" href="/setup-admin">
          Criar primeiro admin
        </Link>
      </section>
    </main>
  );
}
