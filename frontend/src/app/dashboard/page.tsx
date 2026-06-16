import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardPanel } from "@/features/dashboard/dashboard-panel";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="dashboard.eyebrow"
        titleKey="dashboard.title"
        descriptionKey="dashboard.description"
      />
      <DashboardPanel />
    </AppShell>
  );
}
