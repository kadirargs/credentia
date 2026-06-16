import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardPanel } from "@/features/dashboard/dashboard-panel";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Finans özeti"
        title="Genel görünüm"
        description="Gelir, gider, net bakiye, son işlemler ve kategori bazlı dağılımlar."
      />
      <DashboardPanel />
    </AppShell>
  );
}
