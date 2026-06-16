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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "İşlemler", icon: Receipt },
  { href: "/categories", label: "Kategoriler", icon: Folder },
  { href: "/budgets", label: "Bütçeler", icon: WalletCards },
  { href: "/reports", label: "Raporlar", icon: BarChart3 }
];

const simulationItems = [
  { href: "/investment-simulation/portfolio", label: "Portföy Backtest", icon: TrendingUp },
  { href: "/investment-simulation/ai-rivals", label: "Strateji Laboratuvarı", icon: FlaskConical },
  { href: "/investment-simulation/crisis-scenarios", label: "Kriz Senaryosu", icon: ShieldAlert }
];

const utilityItems = [
  { href: "/assistant", label: "AI Asistan", icon: Bot },
  { href: "/preferences", label: "Tercihler", icon: Settings }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-logo-wrap">
            <img alt="" className="brand-logo" src="/credentia-logo.png" />
          </span>
          Credentia
        </Link>
        <nav className="nav" aria-label="Ana menü">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="nav-group">
            <Link className="nav-group-parent" href="/investment-simulation">
              <TrendingUp size={18} />
              <span>Yatırım Simülasyonları</span>
            </Link>
            <div className="nav-subitems">
              {simulationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} key={item.href}>
                    <Icon size={16} />
                    <span>{item.label}</span>
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="card sidebar-note">
          <PieChart size={22} />
          <p>Aylık bütçe kullanımı ve kategori dağılımı tek ekranda izlenir.</p>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
