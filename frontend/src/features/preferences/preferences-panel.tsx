"use client";

import { BadgeDollarSign, BarChart3, CircleDollarSign, Euro, Languages, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useCurrencyPreference, useDashboardViewMode, useLanguage, useTheme } from "@/components/theme/theme-provider";
import type { TranslationKey } from "@/lib/translations";

const themeOptions = [
  {
    value: "light",
    labelKey: "preferences.lightTheme",
    descriptionKey: "preferences.lightThemeDescription",
    icon: Sun
  },
  {
    value: "dark",
    labelKey: "preferences.darkTheme",
    descriptionKey: "preferences.darkThemeDescription",
    icon: Moon
  }
] as const;

const dashboardViewOptions = [
  {
    value: "simple",
    labelKey: "preferences.simple",
    descriptionKey: "preferences.simpleDescription",
    icon: LayoutDashboard
  },
  {
    value: "detailed",
    labelKey: "preferences.detailed",
    descriptionKey: "preferences.detailedDescription",
    icon: BarChart3
  }
] as const;

const currencyOptions = [
  {
    value: "TRY",
    labelKey: "preferences.try",
    descriptionKey: "preferences.tryDescription",
    icon: BadgeDollarSign
  },
  {
    value: "USD",
    labelKey: "preferences.usd",
    descriptionKey: "preferences.usdDescription",
    icon: CircleDollarSign
  },
  {
    value: "EUR",
    labelKey: "preferences.eur",
    descriptionKey: "preferences.eurDescription",
    icon: Euro
  }
] as const;

const languageOptions = [
  {
    value: "tr",
    labelKey: "preferences.turkish"
  },
  {
    value: "en",
    labelKey: "preferences.english"
  }
] as const;

export function PreferencesPanel() {
  const { theme, setTheme } = useTheme();
  const { dashboardViewMode, setDashboardViewMode } = useDashboardViewMode();
  const { currency, exchangeRateDate, exchangeRates, exchangeRateStatus, refreshExchangeRates, setCurrency } = useCurrencyPreference();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="preferences-stack">
      <section className="card preferences-card">
        <div>
          <h2>{t("preferences.appearance")}</h2>
          <p className="muted">{t("preferences.appearanceDescription")}</p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label={t("preferences.appearance")}>
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
                  <strong>{t(option.labelKey as TranslationKey)}</strong>
                  <small>{t(option.descriptionKey as TranslationKey)}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card preferences-card">
        <div>
          <h2>{t("preferences.dashboardView")}</h2>
          <p className="muted">{t("preferences.dashboardViewDescription")}</p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label={t("preferences.dashboardView")}>
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
                  <strong>{t(option.labelKey as TranslationKey)}</strong>
                  <small>{t(option.descriptionKey as TranslationKey)}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card preferences-card">
        <div>
          <h2>{t("preferences.currency")}</h2>
          <p className="muted">{t("preferences.currencyDescription")}</p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label={t("preferences.currency")}>
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
                  <strong>{t(option.labelKey as TranslationKey)}</strong>
                  <small>{t(option.descriptionKey as TranslationKey)}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="currency-rate-note">
          <span>
            {exchangeRateStatus === "loading"
              ? t("preferences.rateLoading")
              : exchangeRateStatus === "error"
                ? t("preferences.rateError")
                : `${t("preferences.rateDate")}: ${exchangeRateDate ?? "-"}`}
          </span>
          <span>
            1 TL = ${exchangeRates.USD?.toLocaleString("tr-TR", { maximumFractionDigits: 5 }) ?? "-"} / €
            {exchangeRates.EUR?.toLocaleString("tr-TR", { maximumFractionDigits: 5 }) ?? "-"}
          </span>
          <button className="small-button" type="button" onClick={() => void refreshExchangeRates()}>
            {t("preferences.refreshRate")}
          </button>
        </div>
      </section>

      <section className="card preferences-card">
        <div>
          <h2>{t("preferences.language")}</h2>
          <p className="muted">{t("preferences.languageDescription")}</p>
        </div>

        <div className="theme-options" role="radiogroup" aria-label={t("preferences.language")}>
          {languageOptions.map((option) => {
            const selected = language === option.value;

            return (
              <button
                aria-checked={selected}
                className={`theme-option ${selected ? "selected" : ""}`}
                key={option.value}
                onClick={() => setLanguage(option.value)}
                role="radio"
                type="button"
              >
                <Languages size={22} />
                <span>
                  <strong>{t(option.labelKey as TranslationKey)}</strong>
                  <small>{option.value}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
