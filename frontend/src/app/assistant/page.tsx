import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AssistantPanel } from "@/features/assistant/assistant-panel";

export default function AssistantPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Finans asistanı"
        title="Credentia Asistan"
        description="Finans verileriniz, uygulama kullanımı ve günlük planlama konularında sohbet edin."
      />
      <AssistantPanel />
    </AppShell>
  );
}
