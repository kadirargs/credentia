"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCurrencyFormatter, useCurrencyPreference } from "@/components/theme/theme-provider";
import { CategoryChart } from "@/features/dashboard/category-chart";
import type { CategoryBreakdownItem, MonthlySummary } from "@/features/dashboard/types";
import { apiDownload, apiGet } from "@/lib/api";
import { formatDate, formatMonthYear } from "@/lib/format";

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

function recentMonthOptions() {
  const today = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return {
      key: `${year}-${month}`,
      label: formatMonthYear(month, year),
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

function transactionTypeLabel(type: ReportTransaction["type"]) {
  return type === "income" ? "Gelir" : "Gider";
}

export function ReportsPanel() {
  const { currency } = useCurrencyPreference();
  const { formatCurrency } = useCurrencyFormatter();
  const [period, setPeriod] = useState<Period>(() => currentPeriod());
  const [data, setData] = useState<ReportsData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [exportStatus, setExportStatus] = useState<"idle" | ExportType>("idle");
  const [exportError, setExportError] = useState("");
  const periodOptions = useMemo(() => recentMonthOptions(), []);

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
      setExportError("Rapor dışa aktarılırken bir sorun oluştu.");
    } finally {
      setExportStatus("idle");
    }
  }

  if (status === "loading") {
    return <section className="card"><div className="state-card">Rapor verileri yükleniyor.</div></section>;
  }

  if (status === "error" || !data) {
    return <section className="card"><div className="state-card error">Rapor verileri alınamadı. Backend çalışıyor mu?</div></section>;
  }

  const hasReportData = data.transactions.length > 0;

  return (
    <div className="grid content-grid">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Özet</h2>
            <p className="muted">Dönem: {formatMonthYear(period.month, period.year)}</p>
          </div>
          <label className="field compact-field">
            <span>Dönem</span>
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
            {exportStatus === "pdf" ? "PDF hazırlanıyor" : "PDF indir"}
          </button>
          <button className="secondary-button" disabled={exportStatus !== "idle"} type="button" onClick={() => void handleExport("excel")}>
            {exportStatus === "excel" ? "Excel hazırlanıyor" : "Excel indir"}
          </button>
        </div>
        {exportError ? <p className="form-error">{exportError}</p> : null}

        {!hasReportData ? (
          <div className="empty-state">Bu dönemde kayıtlı veri bulunamadı.</div>
        ) : null}
        <div className="status-list">
          <div className="status-row">
            <span>Toplam gelir</span>
            <strong className="positive">{formatCurrency(data.summary.income)}</strong>
          </div>
          <div className="status-row">
            <span>Toplam gider</span>
            <strong className="negative">{formatCurrency(data.summary.expense)}</strong>
          </div>
          <div className="status-row">
            <span>Net bakiye</span>
            <strong>{formatCurrency(data.summary.balance)}</strong>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <h2>İşlem dökümü</h2>
          <div className="table-scroll" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Açıklama</th>
                  <th>Kategori</th>
                  <th>Tür</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.length === 0 ? (
                  <tr>
                    <td className="muted" colSpan={5}>
                      Bu dönemde kayıtlı işlem yok.
                    </td>
                  </tr>
                ) : (
                  data.transactions.map((transaction, index) => (
                    <tr key={`${transaction.occurred_on}-${transaction.category}-${transaction.amount}-${index}`}>
                      <td>{formatDate(transaction.occurred_on)}</td>
                      <td>{transaction.description || "Açıklama yok"}</td>
                      <td>{transaction.category || "Kategori yok"}</td>
                      <td>{transactionTypeLabel(transaction.type)}</td>
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
        <h2>Kategori bazlı giderler</h2>
        {data.expense_breakdown.length === 0 ? (
          <div className="empty-state">Bu dönemde kategorili gider işlemi yok.</div>
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
          <h2>Kategori bazlı gelirler</h2>
          {data.income_breakdown.length === 0 ? (
            <div className="empty-state">Bu dönemde kategorili gelir işlemi yok.</div>
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
