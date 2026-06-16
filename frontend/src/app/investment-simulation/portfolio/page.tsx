import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { InvestmentSimulationPanel } from "@/features/investment-simulation/investment-simulation-panel";

export default function PortfolioSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Simülasyon"
        title="Portföy Backtest"
        description="Risk tercihi, vade ve yatırım tutarına göre geçmiş fiyat verileriyle teorik bir portföy simülasyonu oluştur."
      />
      <InvestmentSimulationPanel />
    </AppShell>
  );
}
