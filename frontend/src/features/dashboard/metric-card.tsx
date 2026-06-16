"use client";

import { useCurrencyFormatter, useLanguage } from "@/components/theme/theme-provider";

type MetricCardProps = {
  label: string;
  value: number;
  tone?: "positive" | "negative" | "neutral";
  suffix?: string;
  changePercent?: number;
  comparisonUnavailable?: boolean;
  showComparison?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

function formatChangePercent(value: number, language: "tr" | "en") {
  const absoluteValue = Math.abs(value);
  const formatted = absoluteValue.toLocaleString(language === "en" ? "en-US" : "tr-TR", { maximumFractionDigits: 2 });
  return language === "en" ? `${formatted}%` : `%${formatted}`;
}

function changeText(value: number, language: "tr" | "en", comparedToPreviousMonth: string) {
  const prefix = value > 0 ? "\u2191" : value < 0 ? "\u2193" : "";
  return `${prefix ? `${prefix} ` : ""}${formatChangePercent(value, language)} ${comparedToPreviousMonth}`;
}

export function MetricCard({
  label,
  value,
  tone = "neutral",
  suffix,
  changePercent,
  comparisonUnavailable = false,
  showComparison = true,
  selected = false,
  onClick
}: MetricCardProps) {
  const { formatCurrency } = useCurrencyFormatter();
  const { language, t } = useLanguage();
  const hasValidChange = typeof changePercent === "number" && Number.isFinite(changePercent);
  const shouldShowComparison = showComparison && (comparisonUnavailable || hasValidChange);
  const changeTone = hasValidChange && changePercent > 0 ? "positive" : hasValidChange && changePercent < 0 ? "negative" : "";

  const content = (
    <>
      <p className="metric-label">{label}</p>
      <p className={`metric-value ${tone === "positive" ? "positive" : tone === "negative" ? "negative" : ""}`}>
        {suffix ? `${value}${suffix}` : formatCurrency(value)}
      </p>
      {shouldShowComparison ? (
        <p className={`metric-change ${comparisonUnavailable ? "" : changeTone}`}>
          {comparisonUnavailable || !hasValidChange
            ? t("dashboard.noComparison")
            : changeText(changePercent, language, t("dashboard.comparedToPreviousMonth"))}
        </p>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button className={`card metric metric-button ${selected ? "selected" : ""}`} type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <section className="card metric">{content}</section>;
}
