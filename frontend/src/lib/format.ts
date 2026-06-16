export type CurrencyCode = "TRY" | "USD" | "EUR";

const currencyLocales: Record<CurrencyCode, string> = {
  TRY: "tr-TR",
  USD: "en-US",
  EUR: "tr-TR"
};

export function formatCurrency(value: number, currency: CurrencyCode = "TRY") {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(safeValue);
}

function localeFromLanguage(language: "tr" | "en" = "tr") {
  return language === "en" ? "en-US" : "tr-TR";
}

export function formatDate(value: string, language: "tr" | "en" = "tr") {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat(localeFromLanguage(language), {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

export function formatMonthYear(month: number, year: number, language: "tr" | "en" = "tr") {
  return new Intl.DateTimeFormat(localeFromLanguage(language), {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}
