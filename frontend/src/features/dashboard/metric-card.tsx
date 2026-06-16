"use client";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";

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

function formatChangePercent(value: number) {
  const absoluteValue = Math.abs(value);
  return `%${absoluteValue.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

function changeText(value: number) {
  if (value > 0) return `\u2191 ${formatChangePercent(value)} ge\u00e7en aya g\u00f6re`;
  if (value < 0) return `\u2193 ${formatChangePercent(value)} ge\u00e7en aya g\u00f6re`;
  return `%0 ge\u00e7en aya g\u00f6re`;
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
          {comparisonUnavailable || !hasValidChange ? "Kar\u015f\u0131la\u015ft\u0131rma verisi yok" : changeText(changePercent)}
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
