import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { BudgetsPanel } from "@/features/budgets/budgets-panel";

export default function BudgetsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="budgets.eyebrow"
        titleKey="budgets.title"
        descriptionKey="budgets.description"
      />
      <BudgetsPanel />
    </AppShell>
  );
}
