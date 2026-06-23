import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BeforeAfterManager } from "@/components/before-after-manager";
import { ColorHistoryManager } from "@/components/color-history-manager";
import { PageHeader } from "@/components/page-header";
import { ProductHistoryManager } from "@/components/product-history-manager";
import { VisitHistoryManager } from "@/components/visit-history-manager";
import { getBeforeAfterHistory, getColorHistory, getCustomer, getProductHistory, getProfessionals, getVisitHistory } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, visits, colors, products, professionals, beforeAfter] = await Promise.all([
    getCustomer(params.id),
    getVisitHistory(params.id),
    getColorHistory(params.id),
    getProductHistory(params.id),
    getProfessionals(),
    getBeforeAfterHistory(params.id)
  ]);

  if (!customer) notFound();

  return (
    <AppShell>
      <PageHeader
        title={customer.name}
        description="Perfil da cliente e histórico técnico de visitas."
        action={
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-champagne"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <Info label="Nome" value={customer.name} />
        <Info label="Telefone" value={customer.phone} />
        <Info label="Email" value={customer.email} />
        <Info label="Data de nascimento" value={customer.birth_date} />
        <Info label="Última visita" value={customer.last_visit_date ?? customer.last_visit} />
      </section>

      <VisitHistoryManager customer={customer} initialVisits={visits} professionals={professionals} />

      <ProductHistoryManager customer={customer} initialProducts={products} />

      <ColorHistoryManager customer={customer} initialColors={colors} />

      <BeforeAfterManager customer={customer} initialEntries={beforeAfter} />
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value || "Sem registo"}</p>
    </div>
  );
}
