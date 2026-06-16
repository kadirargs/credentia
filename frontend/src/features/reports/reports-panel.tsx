"use client";

import { useCallback, useEffect, useState } from "react";

import { useCurrencyFormatter } from "@/components/theme/theme-provider";
import type { Category } from "@/features/categories/types";
import { CategoryChart } from "@/features/dashboard/category-chart";
import type { CategoryBreakdownItem, MonthlySummary } from "@/features/dashboard/types";
import { TransactionTable, type Transaction } from "@/features/transactions/transaction-table";
import { apiGet } from "@/lib/api";

type ReportsData = {
  categories: Category[];
  expenseBreakdown: CategoryBreakdownItem[];
  incomeBreakdown: CategoryBreakdownItem[];
  summary: MonthlySummary;
  transactions: Transaction[];
};

export function ReportsPanel() {
  const { formatCurrency } = useCurrencyFormatter();
  const [data, setData] = useState<ReportsData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadReports = useCallback(async () => {
    try {
      const [summary, incomeBreakdown, expenseBreakdown, transactions, categories] = await Promise.all([
        apiGet<MonthlySummary>("/api/analytics/monthly-summary"),
        apiGet<CategoryBreakdownItem[]>("/api/analytics/category-breakdown?type=income"),
        apiGet<CategoryBreakdownItem[]>("/api/analytics/category-breakdown?type=expense"),
        apiGet<Transaction[]>("/api/transactions"),
        apiGet<Category[]>("/api/categories")
      ]);

      setData({
        categories,
        expenseBreakdown,
        incomeBreakdown,
        summary,
        transactions
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

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
        <h2>Özet</h2>
        {!hasReportData ? (
          <div className="empty-state">Rapor oluşturmak için henüz yeterli işlem verisi yok.</div>
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
            <TransactionTable
              categories={data.categories}
              emptyMessage="Henüz işlem yok. Raporlar işlem eklendikçe dolacak."
              transactions={data.transactions}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Kategori bazlı giderler</h2>
        {data.expenseBreakdown.length === 0 ? (
          <div className="empty-state">Henüz kategorili gider işlemi yok.</div>
        ) : (
          <>
            <CategoryChart data={data.expenseBreakdown} />
            <div className="status-list">
              {data.expenseBreakdown.map((item) => (
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
          {data.incomeBreakdown.length === 0 ? (
            <div className="empty-state">Henüz kategorili gelir işlemi yok.</div>
          ) : (
            <div className="status-list" style={{ marginTop: 12 }}>
              {data.incomeBreakdown.map((item) => (
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
