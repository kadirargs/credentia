import { FlaskConical, ShieldAlert, TrendingUp } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";

const simulations = [
  {
    href: "/investment-simulation/portfolio",
    title: "Portföy Backtest",
    description: "Risk, vade ve tutara göre kripto portföyünün geçmiş performansını hesapla.",
    icon: TrendingUp
  },
  {
    href: "/investment-simulation/ai-rivals",
    title: "Strateji Laboratuvarı",
    description: "Farklı risk profillerinin geçmiş piyasa verilerinde nasıl davrandığını karşılaştır.",
    icon: FlaskConical
  },
  {
    href: "/investment-simulation/crisis-scenarios",
    title: "Kriz Senaryosu",
    description: "Belirli kriz dönemlerinde seçili varlığın teorik seyrini incele.",
    icon: ShieldAlert
  }
];

export default function InvestmentSimulationPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Simülasyon"
        title="Yatırım Simülasyonları"
        description="Kullanmak istediğin simülasyon türünü seç."
      />
      <section className="simulation-picker-grid">
        {simulations.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="card simulation-picker-card" href={item.href} key={item.href}>
              <Icon size={24} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
