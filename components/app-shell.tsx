import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CalendarHeart, Gem, LayoutDashboard, Scissors, UserRoundPlus, UsersRound } from "lucide-react";

const navItems: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: UsersRound },
  { href: "/agenda", label: "Agenda", icon: CalendarCheck },
  { href: "/clientes/em-risco", label: "Em risco", icon: CalendarHeart },
  { href: "/servicos", label: "Servicos", icon: Scissors }
];

const isDevMode = process.env.DEV_MODE === "true";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white/72 backdrop-blur-sm">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white/88 px-4 py-5 shadow-soft lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
            <Gem className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold text-ink">Beauty CRM Pro</span>
            <span className="text-xs text-stone-500">Salao inteligente</span>
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-champagne hover:text-ink"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/clientes"
          className="mt-8 flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blush/90"
        >
          <UserRoundPlus className="h-4 w-4" />
          Novo cliente
        </Link>
      </aside>

      <div className="lg:pl-64">
        {isDevMode ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-700">
            Modo desenvolvimento - login desativado
          </div>
        ) : null}
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/88 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="font-semibold text-ink">
              Beauty CRM Pro
            </Link>
            <Link href="/agenda" className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white">
              Agenda
            </Link>
          </div>
          <nav className="mt-3 grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="grid place-items-center rounded-md px-2 py-2 text-xs text-stone-600 hover:bg-champagne"
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
