"use client";

import { createContext, useContext, useCallback, useLayoutEffect, useMemo, useState } from "react";

import { formatCurrency as formatCurrencyValue, type CurrencyCode } from "@/lib/format";
import { normalizeLanguage, translate, type LanguageCode, type TranslationKey } from "@/lib/translations";

type Theme = "light" | "dark";
export type DashboardViewMode = "simple" | "detailed";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  dashboardViewMode: DashboardViewMode;
  setDashboardViewMode: (mode: DashboardViewMode) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  exchangeRates: Partial<ExchangeRates>;
  exchangeRateDate: string | null;
  exchangeRateStatus: "idle" | "loading" | "ready" | "error";
  refreshExchangeRates: () => Promise<void>;
};

const THEME_STORAGE_KEY = "credentia-theme";
const DASHBOARD_VIEW_STORAGE_KEY = "credentia-dashboard-view";
const CURRENCY_STORAGE_KEY = "credentia-currency";
const LANGUAGE_STORAGE_KEY = "credentia-language";
const EXCHANGE_RATES_STORAGE_KEY = "credentia-exchange-rates";
const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/TRY";
const ThemeContext = createContext<ThemeContextValue | null>(null);

type ExchangeRates = Record<CurrencyCode, number>;

type StoredExchangeRates = {
  date: string;
  rates: Partial<ExchangeRates>;
};

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

function readStoredDashboardViewMode(): DashboardViewMode {
  if (typeof window === "undefined") return "detailed";
  const storedMode = window.localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
  return storedMode === "simple" ? "simple" : "detailed";
}

function readStoredCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "TRY";
  const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  return storedCurrency === "USD" || storedCurrency === "EUR" ? storedCurrency : "TRY";
}

function readStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "tr";
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

function readStoredExchangeRates(): StoredExchangeRates | null {
  if (typeof window === "undefined") return null;

  try {
    const storedValue = window.localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
    if (!storedValue) return null;

    const parsed = JSON.parse(storedValue) as StoredExchangeRates;
    if (!parsed.date || typeof parsed.rates !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

function getLocalDateLabel() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function normalizeExchangeRates(payload: unknown): StoredExchangeRates {
  const rates: Partial<ExchangeRates> = { TRY: 1 };
  let date = getLocalDateLabel();

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const row = item as { date?: unknown; quote?: unknown; rate?: unknown };
      if (typeof row.date === "string") date = row.date;
      if ((row.quote === "USD" || row.quote === "EUR") && typeof row.rate === "number" && Number.isFinite(row.rate)) {
        rates[row.quote] = row.rate;
      }
    }
  } else if (payload && typeof payload === "object") {
    const row = payload as { rates?: unknown; value?: unknown };

    if (row.rates && typeof row.rates === "object") {
      const sourceRates = row.rates as Record<string, unknown>;
      if (typeof sourceRates.USD === "number" && Number.isFinite(sourceRates.USD)) rates.USD = sourceRates.USD;
      if (typeof sourceRates.EUR === "number" && Number.isFinite(sourceRates.EUR)) rates.EUR = sourceRates.EUR;
    }

    if (Array.isArray(row.value)) {
      return normalizeExchangeRates(row.value);
    }
  }

  return { date, rates };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const body = document.body;

  root.dataset.theme = theme;
  root.classList.toggle("theme-dark", theme === "dark");
  root.classList.toggle("theme-light", theme === "light");
  root.style.colorScheme = theme;

  if (body) {
    body.dataset.theme = theme;
    body.classList.toggle("theme-dark", theme === "dark");
    body.classList.toggle("theme-light", theme === "light");
  }
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [dashboardViewMode, setDashboardViewModeState] = useState<DashboardViewMode>("detailed");
  const [currency, setCurrencyState] = useState<CurrencyCode>("TRY");
  const [language, setLanguageState] = useState<LanguageCode>("tr");
  const [exchangeRates, setExchangeRates] = useState<Partial<ExchangeRates>>({ TRY: 1 });
  const [exchangeRateDate, setExchangeRateDate] = useState<string | null>(null);
  const [exchangeRateStatus, setExchangeRateStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const refreshExchangeRates = useCallback(async () => {
    setExchangeRateStatus("loading");

    try {
      const response = await fetch(`${EXCHANGE_RATE_API_URL}?_=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Exchange rate request failed");
      }

      const payload = await response.json();
      const next = normalizeExchangeRates(payload);
      const nextRates = { TRY: 1, ...next.rates };

      setExchangeRates(nextRates);
      setExchangeRateDate(next.date);
      setExchangeRateStatus("ready");
      window.localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify({ date: next.date, rates: nextRates }));
    } catch {
      const cachedRates = readStoredExchangeRates();
      if (cachedRates) {
        setExchangeRates({ TRY: 1, ...cachedRates.rates });
        setExchangeRateDate(cachedRates.date);
      }
      setExchangeRateStatus("error");
    }
  }, []);

  useLayoutEffect(() => {
    const storedTheme = readStoredTheme();
    const storedDashboardViewMode = readStoredDashboardViewMode();
    const storedCurrency = readStoredCurrency();
    const storedLanguage = readStoredLanguage();
    const storedExchangeRates = readStoredExchangeRates();
    setThemeState(storedTheme);
    setDashboardViewModeState(storedDashboardViewMode);
    setCurrencyState(storedCurrency);
    setLanguageState(storedLanguage);
    if (storedExchangeRates) {
      setExchangeRates({ TRY: 1, ...storedExchangeRates.rates });
      setExchangeRateDate(storedExchangeRates.date);
      setExchangeRateStatus("ready");
    }
    applyTheme(storedTheme);
    void refreshExchangeRates();
  }, [refreshExchangeRates]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      },
      dashboardViewMode,
      setDashboardViewMode: (nextMode) => {
        setDashboardViewModeState(nextMode);
        window.localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, nextMode);
      },
      currency,
      setCurrency: (nextCurrency) => {
        setCurrencyState(nextCurrency);
        window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
        if (nextCurrency !== "TRY" && exchangeRateStatus !== "loading") {
          void refreshExchangeRates();
        }
      },
      language,
      setLanguage: (nextLanguage) => {
        const normalizedLanguage = normalizeLanguage(nextLanguage);
        setLanguageState(normalizedLanguage);
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
      },
      t: (key) => translate(language, key),
      exchangeRates,
      exchangeRateDate,
      exchangeRateStatus,
      refreshExchangeRates
    }),
    [currency, dashboardViewMode, exchangeRateDate, exchangeRateStatus, exchangeRates, language, refreshExchangeRates, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}

export function useDashboardViewMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useDashboardViewMode must be used inside ThemeProvider");
  }
  return {
    dashboardViewMode: context.dashboardViewMode,
    setDashboardViewMode: context.setDashboardViewMode
  };
}

export function useCurrencyPreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useCurrencyPreference must be used inside ThemeProvider");
  }
  return {
    currency: context.currency,
    setCurrency: context.setCurrency,
    exchangeRates: context.exchangeRates,
    exchangeRateDate: context.exchangeRateDate,
    exchangeRateStatus: context.exchangeRateStatus,
    refreshExchangeRates: context.refreshExchangeRates
  };
}

export function useCurrencyFormatter() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useCurrencyFormatter must be used inside ThemeProvider");
  }

  return {
    currency: context.currency,
    exchangeRateDate: context.exchangeRateDate,
    exchangeRateStatus: context.exchangeRateStatus,
    formatCurrency: (value: number) => {
      const safeValue = Number.isFinite(value) ? value : 0;
      const selectedRate = context.exchangeRates[context.currency];
      if (!selectedRate || !Number.isFinite(selectedRate)) {
        return formatCurrencyValue(safeValue, "TRY");
      }

      return formatCurrencyValue(safeValue * selectedRate, context.currency);
    }
  };
}

export function useLanguage() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useLanguage must be used inside ThemeProvider");
  }
  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t: context.t
  };
}
