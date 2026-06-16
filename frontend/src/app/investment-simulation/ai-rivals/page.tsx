import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AiRivalsPanel } from "@/features/ai-rivals/ai-rivals-panel";

export default function AiRivalsSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="strategy.eyebrow"
        titleKey="strategy.title"
        descriptionKey="strategy.description"
      />
      <AiRivalsPanel />
    </AppShell>
  );
}
