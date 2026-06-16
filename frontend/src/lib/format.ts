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

export function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

export function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}
