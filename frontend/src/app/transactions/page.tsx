import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { TransactionsPanel } from "@/features/transactions/transactions-panel";

export default function TransactionsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="İşlemler"
        title="Gelir ve giderler"
        description="Gelir ve giderleri PostgreSQL'e kaydet ve gerçek API'den listele."
      />
      <TransactionsPanel />
    </AppShell>
  );
}
