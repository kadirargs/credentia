import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsPanel } from "@/features/reports/reports-panel";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="reports.eyebrow"
        titleKey="reports.title"
        descriptionKey="reports.description"
      />
      <ReportsPanel />
    </AppShell>
  );
}
