import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { BudgetsPanel } from "@/features/budgets/budgets-panel";

export default function BudgetsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Bütçeler"
        title="Limit takibi"
        description="Kategori bazlı aylık bütçe oluştur ve gerçekleşen harcamayı takip et."
      />
      <BudgetsPanel />
    </AppShell>
  );
}
