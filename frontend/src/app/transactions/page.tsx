import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { TransactionsPanel } from "@/features/transactions/transactions-panel";

export default function TransactionsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="transactions.eyebrow"
        titleKey="transactions.title"
        descriptionKey="transactions.description"
      />
      <TransactionsPanel />
    </AppShell>
  );
}
