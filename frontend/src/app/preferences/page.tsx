import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PreferencesPanel } from "@/features/preferences/preferences-panel";

export default function PreferencesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="common.preferences"
        titleKey="preferences.title"
        descriptionKey="preferences.description"
      />
      <PreferencesPanel />
    </AppShell>
  );
}
