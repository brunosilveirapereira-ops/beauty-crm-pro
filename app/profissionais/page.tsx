import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProfessionalsManager } from "@/components/professionals-manager";
import { getProfessionals, getServices } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfessionalsPage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()]);

  return (
    <AppShell>
      <PageHeader
        title="Profissionais"
        description="Cadastre a equipa, defina comissões e acompanhe o valor gerado por profissional."
      />
      <ProfessionalsManager initialProfessionals={professionals} initialServices={services} />
    </AppShell>
  );
}
