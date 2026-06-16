import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AiRivalsPanel } from "@/features/ai-rivals/ai-rivals-panel";

export default function AiRivalsSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Simülasyon"
        title="Strateji Laboratuvarı"
        description="Farklı risk profillerinin geçmiş piyasa verilerinde nasıl sonuç verdiğini karşılaştırın ve risk-getiri ilişkisini daha iyi anlayın."
      />
      <AiRivalsPanel />
    </AppShell>
  );
}
