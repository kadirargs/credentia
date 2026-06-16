"use client";

import { FlaskConical, ShieldAlert, TrendingUp } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { useLanguage } from "@/components/theme/theme-provider";
import { PageHeader } from "@/components/ui/page-header";
import type { TranslationKey } from "@/lib/translations";

const simulations = [
  {
    href: "/investment-simulation/portfolio",
    titleKey: "common.portfolioBacktest",
    descriptionKey: "portfolio.description",
    icon: TrendingUp
  },
  {
    href: "/investment-simulation/ai-rivals",
    titleKey: "common.strategyLab",
    descriptionKey: "strategy.description",
    icon: FlaskConical
  },
  {
    href: "/investment-simulation/crisis-scenarios",
    titleKey: "common.crisisScenarios",
    descriptionKey: "crisis.description",
    icon: ShieldAlert
  }
];

export default function InvestmentSimulationPage() {
  const { t } = useLanguage();

  return (
    <AppShell>
      <PageHeader
        eyebrowKey="investment.eyebrow"
        titleKey="investment.title"
        descriptionKey="investment.description"
      />
      <section className="simulation-picker-grid">
        {simulations.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="card simulation-picker-card" href={item.href} key={item.href}>
              <Icon size={24} />
              <span>
                <strong>{t(item.titleKey as TranslationKey)}</strong>
                <small>{t(item.descriptionKey as TranslationKey)}</small>
              </span>
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
