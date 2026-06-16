import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AssistantPanel } from "@/features/assistant/assistant-panel";

export default function AssistantPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="assistant.eyebrow"
        titleKey="assistant.title"
        descriptionKey="assistant.description"
      />
      <AssistantPanel />
    </AppShell>
  );
}
