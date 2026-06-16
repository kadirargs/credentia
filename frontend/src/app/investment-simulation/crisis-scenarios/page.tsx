import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { CrisisScenariosPanel } from "@/features/crisis-scenarios/crisis-scenarios-panel";

export default function CrisisScenariosSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="crisis.eyebrow"
        titleKey="crisis.title"
        descriptionKey="crisis.description"
      />
      <CrisisScenariosPanel />
    </AppShell>
  );
}
