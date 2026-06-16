import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { InvestmentSimulationPanel } from "@/features/investment-simulation/investment-simulation-panel";

export default function PortfolioSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrowKey="portfolio.eyebrow"
        titleKey="portfolio.title"
        descriptionKey="portfolio.description"
      />
      <InvestmentSimulationPanel />
    </AppShell>
  );
}
