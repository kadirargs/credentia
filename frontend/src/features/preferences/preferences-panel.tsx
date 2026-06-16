"use client";

import { BadgeDollarSign, BarChart3, CircleDollarSign, Euro, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useCurrencyPreference, useDashboardViewMode, useTheme } from "@/components/theme/theme-provider";

const themeOptions = [
  {
    value: "light",
    label: "Açık tema",
    description: "Gündüz kullanımına uygun açık arayüz.",
    icon: Sun
  },
  {
    value: "dark",
    label: "Koyu tema",
    description: "Daha düşük parlaklıkla koyu arayüz.",
    icon: Moon
  }
] as const;

const dashboardViewOptions = [
  {
    value: "simple",
    label: "Sade",
    description: "Yalnızca temel finans özeti, son işlemler ve kategori grafiği.",
    icon: LayoutDashboard
  },
  {
    value: "detailed",
    label: "Detaylı",
    description: "Temel özetlere ek olarak gelişmiş analytics kartları.",
    icon: BarChart3
  }
] as const;

const currencyOptions = [
  {
    value: "TRY",
    label: "Türk Lirası (₺)",
    description: "₺ sembolü ve Türkçe sayı formatı.",
    icon: BadgeDollarSign
  },
  {
    value: "USD",
    label: "Dolar ($)",
    description: "$ sembolü ve dolar gösterimi.",
    icon: CircleDollarSign
  },
  {
    value: "EUR",
    label: "Euro (€)",
    description: "€ sembolü ve euro gösterimi.",
    icon: Euro
  }
] as const;

export function PreferencesPanel() {
  const { theme, setTheme } = useTheme();
  const { dashboardViewMode, setDashboardViewMode } = useDashboardViewMode();
  const { currency, exchangeRateDate, exchangeRates, exchangeRateStatus, refreshExchangeRates, setCurrency } = useCurrencyPreference();

  return (
    <div className="preferences-stack">
      <section className="card preferences-card">
        <div>
          <h2>Görünüm</h2>
          <p className="muted">Uygulama temasını seç. Tercihin bu tarayıcıda kalıcı olarak saklanır.</p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label="Tema seçimi">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const selected = theme === option.value;

            return (
              <button
                aria-checked={selected}
                className={`theme-option ${selected ? "selected" : ""}`}
                key={option.value}
                onClick={() => setTheme(option.value)}
                role="radio"
                type="button"
              >
                <Icon size={22} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card preferences-card">
        <div>
          <h2>Dashboard Görünümü</h2>
          <p className="muted">
            Dashboard’da yalnızca temel finans özetini veya gelişmiş analiz kartlarını görüntüleyebilirsiniz.
          </p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label="Dashboard görünümü">
          {dashboardViewOptions.map((option) => {
            const Icon = option.icon;
            const selected = dashboardViewMode === option.value;

            return (
              <button
                aria-checked={selected}
                className={`theme-option ${selected ? "selected" : ""}`}
                key={option.value}
                onClick={() => setDashboardViewMode(option.value)}
                role="radio"
                type="button"
              >
                <Icon size={22} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card preferences-card">
        <div>
          <h2>Para Birimi</h2>
          <p className="muted">
            TL olarak kaydedilen tutarlar, seçilen para birimine güncel TRY kuru ile çevrilerek gösterilir.
          </p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label="Para birimi seçimi">
          {currencyOptions.map((option) => {
            const Icon = option.icon;
            const selected = currency === option.value;

            return (
              <button
                aria-checked={selected}
                className={`theme-option ${selected ? "selected" : ""}`}
                key={option.value}
                onClick={() => setCurrency(option.value)}
                role="radio"
                type="button"
              >
                <Icon size={22} />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="currency-rate-note">
          <span>
            {exchangeRateStatus === "loading"
              ? "Güncel kur alınıyor."
              : exchangeRateStatus === "error"
                ? "Güncel kur alınamadı; varsa son kayıtlı kur kullanılır."
                : `Kur tarihi: ${exchangeRateDate ?? "-"}`}
          </span>
          <span>
            1 TL = ${exchangeRates.USD?.toLocaleString("tr-TR", { maximumFractionDigits: 5 }) ?? "-"} / €
            {exchangeRates.EUR?.toLocaleString("tr-TR", { maximumFractionDigits: 5 }) ?? "-"}
          </span>
          <button className="small-button" type="button" onClick={() => void refreshExchangeRates()}>
            Kuru yenile
          </button>
        </div>
      </section>
    </div>
  );
}
