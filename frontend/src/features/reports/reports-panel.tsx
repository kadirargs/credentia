"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCurrencyFormatter, useCurrencyPreference, useLanguage } from "@/components/theme/theme-provider";
import { CategoryChart } from "@/features/dashboard/category-chart";
import type { CategoryBreakdownItem, MonthlySummary } from "@/features/dashboard/types";
import { apiDownload, apiGet } from "@/lib/api";
import { formatDate, formatMonthYear } from "@/lib/format";
import type { TranslationKey } from "@/lib/translations";

type ReportTransaction = {
  occurred_on: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
};

type ReportsData = {
  expense_breakdown: CategoryBreakdownItem[];
  income_breakdown: CategoryBreakdownItem[];
  summary: MonthlySummary;
  transactions: ReportTransaction[];
};

type Period = {
  year: number;
  month: number;
};

type ExportType = "pdf" | "excel";

function currentPeriod(): Period {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1
  };
}

function recentMonthOptions(language: "tr" | "en") {
  const today = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return {
      key: `${year}-${month}`,
      label: formatMonthYear(month, year, language),
      month,
      year
    };
  });
}

function periodKey(period: Period) {
  return `${period.year}-${period.month}`;
}

function filePeriod(period: Period) {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

function transactionTypeLabel(type: ReportTransaction["type"]): TranslationKey {
  return type === "income" ? "common.income" : "common.expense";
}

export function ReportsPanel() {
  const { currency } = useCurrencyPreference();
  const { formatCurrency } = useCurrencyFormatter();
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState<Period>(() => currentPeriod());
  const [data, setData] = useState<ReportsData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [exportStatus, setExportStatus] = useState<"idle" | ExportType>("idle");
  const [exportError, setExportError] = useState("");
  const periodOptions = useMemo(() => recentMonthOptions(language), [language]);

  const loadReports = useCallback(async () => {
    try {
      setStatus((current) => (current === "ready" ? "ready" : "loading"));
      const report = await apiGet<ReportsData>(`/api/reports/simple?year=${period.year}&month=${period.month}`);

      setData(report);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [period.month, period.year]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    function refreshReports() {
      void loadReports();
    }

    window.addEventListener("focus", refreshReports);
    window.addEventListener("credentia:transactions-updated", refreshReports);
    window.addEventListener("credentia:categories-updated", refreshReports);

    return () => {
      window.removeEventListener("focus", refreshReports);
      window.removeEventListener("credentia:transactions-updated", refreshReports);
      window.removeEventListener("credentia:categories-updated", refreshReports);
    };
  }, [loadReports]);

  async function handleExport(type: ExportType) {
    setExportStatus(type);
    setExportError("");

    try {
      const query = new URLSearchParams({
        year: String(period.year),
        month: String(period.month),
        currency
      });
      const extension = type === "pdf" ? "pdf" : "xlsx";
      await apiDownload(`/api/reports/export/${type}?${query.toString()}`, `credentia-rapor-${filePeriod(period)}.${extension}`);
    } catch {
      setExportError(t("reports.exportError"));
    } finally {
      setExportStatus("idle");
    }
  }

  if (status === "loading") {
    return <section className="card"><div className="state-card">{t("reports.loading")}</div></section>;
  }

  if (status === "error" || !data) {
    return <section className="card"><div className="state-card error">{t("reports.error")}</div></section>;
  }

  const hasReportData = data.transactions.length > 0;

  return (
    <div className="grid content-grid">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>{t("reports.summary")}</h2>
            <p className="muted">{t("reports.period")}: {formatMonthYear(period.month, period.year, language)}</p>
          </div>
          <label className="field compact-field">
            <span>{t("reports.period")}</span>
            <select
              value={periodKey(period)}
              onChange={(event) => {
                const [year, month] = event.target.value.split("-").map(Number);
                setPeriod({ year, month });
              }}
            >
              {periodOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-grid" style={{ marginTop: 14 }}>
          <button className="secondary-button" disabled={exportStatus !== "idle"} type="button" onClick={() => void handleExport("pdf")}>
            {exportStatus === "pdf" ? t("reports.preparingPdf") : t("reports.downloadPdf")}
          </button>
          <button className="secondary-button" disabled={exportStatus !== "idle"} type="button" onClick={() => void handleExport("excel")}>
            {exportStatus === "excel" ? t("reports.preparingExcel") : t("reports.downloadExcel")}
          </button>
        </div>
        {exportError ? <p className="form-error">{exportError}</p> : null}

        {!hasReportData ? (
          <div className="empty-state">{t("reports.noData")}</div>
        ) : null}
        <div className="status-list">
          <div className="status-row">
            <span>{t("reports.totalIncome")}</span>
            <strong className="positive">{formatCurrency(data.summary.income)}</strong>
          </div>
          <div className="status-row">
            <span>{t("reports.totalExpense")}</span>
            <strong className="negative">{formatCurrency(data.summary.expense)}</strong>
          </div>
          <div className="status-row">
            <span>{t("reports.netBalance")}</span>
            <strong>{formatCurrency(data.summary.balance)}</strong>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <h2>{t("reports.transactionList")}</h2>
          <div className="table-scroll" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t("common.date")}</th>
                  <th>{t("common.description")}</th>
                  <th>{t("common.category")}</th>
                  <th>{t("common.type")}</th>
                  <th>{t("common.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.length === 0 ? (
                  <tr>
                    <td className="muted" colSpan={5}>
                      {t("reports.noTransactions")}
                    </td>
                  </tr>
                ) : (
                  data.transactions.map((transaction, index) => (
                    <tr key={`${transaction.occurred_on}-${transaction.category}-${transaction.amount}-${index}`}>
                      <td>{formatDate(transaction.occurred_on, language)}</td>
                      <td>{transaction.description || t("common.noDescription")}</td>
                      <td>{transaction.category || t("common.noCategory")}</td>
                      <td>{t(transactionTypeLabel(transaction.type))}</td>
                      <td className={transaction.type === "income" ? "positive" : "negative"}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>{t("reports.expensesByCategory")}</h2>
        {data.expense_breakdown.length === 0 ? (
          <div className="empty-state">{t("reports.noExpenseCategory")}</div>
        ) : (
          <>
            <CategoryChart data={data.expense_breakdown} />
            <div className="status-list">
              {data.expense_breakdown.map((item) => (
                <div className="status-row" key={item.category}>
                  <span>
                    <span className="swatch" style={{ background: item.color }} />
                    {item.category}
                  </span>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 22 }}>
          <h2>{t("reports.incomeByCategory")}</h2>
          {data.income_breakdown.length === 0 ? (
            <div className="empty-state">{t("reports.noIncomeCategory")}</div>
          ) : (
            <div className="status-list" style={{ marginTop: 12 }}>
              {data.income_breakdown.map((item) => (
                <div className="status-row" key={item.category}>
                  <span>
                    <span className="swatch" style={{ background: item.color }} />
                    {item.category}
                  </span>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
