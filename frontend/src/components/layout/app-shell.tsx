"use client";

import {
  BarChart3,
  Bot,
  FlaskConical,
  Folder,
  Gauge,
  PieChart,
  Receipt,
  Settings,
  ShieldAlert,
  TrendingUp,
  WalletCards
} from "lucide-react";
import Link from "next/link";

import { useLanguage } from "@/components/theme/theme-provider";
import type { TranslationKey } from "@/lib/translations";

const navItems = [
  { href: "/dashboard", labelKey: "common.dashboard", icon: Gauge },
  { href: "/transactions", labelKey: "common.transactions", icon: Receipt },
  { href: "/categories", labelKey: "common.categories", icon: Folder },
  { href: "/budgets", labelKey: "common.budgets", icon: WalletCards },
  { href: "/reports", labelKey: "common.reports", icon: BarChart3 }
];

const simulationItems = [
  { href: "/investment-simulation/portfolio", labelKey: "common.portfolioBacktest", icon: TrendingUp },
  { href: "/investment-simulation/ai-rivals", labelKey: "common.strategyLab", icon: FlaskConical },
  { href: "/investment-simulation/crisis-scenarios", labelKey: "common.crisisScenarios", icon: ShieldAlert }
];

const utilityItems = [
  { href: "/assistant", labelKey: "common.assistant", icon: Bot },
  { href: "/preferences", labelKey: "common.preferences", icon: Settings }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useLanguage();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-logo-wrap">
            <img alt="" className="brand-logo" src="/credentia-logo.png" />
          </span>
          Credentia
        </Link>
        <nav className="nav" aria-label={t("common.dashboard")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{t(item.labelKey as TranslationKey)}</span>
              </Link>
            );
          })}

          <div className="nav-group">
            <Link className="nav-group-parent" href="/investment-simulation">
              <TrendingUp size={18} />
              <span>{t("common.investmentSimulations")}</span>
            </Link>
            <div className="nav-subitems">
              {simulationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} key={item.href}>
                    <Icon size={16} />
                    <span>{t(item.labelKey as TranslationKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {utilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{t(item.labelKey as TranslationKey)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="card sidebar-note">
          <PieChart size={22} />
          <p>{t("common.openingNote")}</p>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
