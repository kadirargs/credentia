import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { PreferencesPanel } from "@/features/preferences/preferences-panel";

export default function PreferencesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Tercihler"
        title="Uygulama ayarları"
        description="Credentia arayüzünü kullanım şekline göre düzenle."
      />
      <PreferencesPanel />
    </AppShell>
  );
}
