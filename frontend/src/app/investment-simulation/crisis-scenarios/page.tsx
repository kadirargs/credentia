import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CrisisScenariosPanel } from "@/features/crisis-scenarios/crisis-scenarios-panel";

export default function CrisisScenariosSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Simülasyon"
        title="Kriz Senaryoları"
        description="Seçilen kriz döneminde kripto varlığın aylık fiyat değişimini ve sanal yatırım değerini inceleyin."
      />
      <CrisisScenariosPanel />
    </AppShell>
  );
}
