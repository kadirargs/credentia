import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsPanel } from "@/features/reports/reports-panel";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Rapor"
        title="Basit aylık rapor"
        description="Gelir, gider, net bakiye, kategori dağılımları ve işlem dökümü."
      />
      <ReportsPanel />
    </AppShell>
  );
}
