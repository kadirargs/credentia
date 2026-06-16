"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BudgetList } from "@/features/budgets/budget-list";
import type { Budget, BudgetSummary } from "@/features/budgets/types";
import type { Category } from "@/features/categories/types";
import { TransactionTable, type Transaction } from "@/features/transactions/transaction-table";
import { useCurrencyFormatter, useDashboardViewMode } from "@/components/theme/theme-provider";
import { apiGet } from "@/lib/api";
import { formatMonthYear } from "@/lib/format";

import { CategoryChart } from "./category-chart";
import { MetricCard } from "./metric-card";
import type { AnalyticsSummaryV2, CategoryBreakdownItem, MonthlySummary, TopCategoryItem } from "./types";

type BreakdownType = "income" | "expense";
type MainPanel = "transactions" | "budgets";
type LoadStatus = "loading" | "ready" | "error";

type Period = {
  year: number;
  month: number;
};

type DashboardData = {
  analyticsSummary: AnalyticsSummaryV2;
  budgetSummary: BudgetSummary;
  budgets: Budget[];
  categories: Category[];
  incomeBreakdown: CategoryBreakdownItem[];
  expenseBreakdown: CategoryBreakdownItem[];
  transactions: Transaction[];
};

type CategoryInsights = {
  selectedMonthIncome: number;
  selectedMonthExpense: number;
  topExpenseCategory: TopCategoryItem | null;
  topIncomeCategory: TopCategoryItem | null;
};

const breakdownLabels = {
  income: {
    title: "Kategori bazlı gelir dağılımı",
    empty: "Henüz kategorili gelir işlemi yok."
  },
  expense: {
    title: "Kategori bazlı gider dağılımı",
    empty: "Henüz kategorili gider işlemi yok."
  }
};

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

function isTransactionInPeriod(transaction: Transaction, period: Period) {
  const [year, month] = transaction.occurred_on.split("-").map(Number);
  return year === period.year && month === period.month;
}

function hasComparisonData(previousValue: number, changePercent: number) {
  return previousValue !== 0 && Number.isFinite(previousValue) && Number.isFinite(changePercent);
}

function summaryFallback(summary: MonthlySummary): AnalyticsSummaryV2 {
  return {
    selectedMonthIncome: summary.income,
    selectedMonthExpense: summary.expense,
    selectedMonthNetBalance: summary.balance,
    previousMonthIncome: 0,
    previousMonthExpense: 0,
    previousMonthNetBalance: 0,
    incomeChangePercent: 0,
    expenseChangePercent: 0,
    netBalanceChangePercent: 0
  };
}

function buildTopCategory(
  transactions: Transaction[],
  categories: Category[],
  type: "income" | "expense"
): { total: number; topCategory: TopCategoryItem | null } {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const totals = new Map<number | null, number>();
  let total = 0;

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;

    const amount = Math.abs(Number(transaction.amount) || 0);
    total += amount;
    const key = transaction.category_id ?? null;
    totals.set(key, (totals.get(key) ?? 0) + amount);
  }

  let topCategory: TopCategoryItem | null = null;
  for (const [categoryId, amount] of totals.entries()) {
    if (amount <= 0) continue;
    if (topCategory && amount <= topCategory.amount) continue;

    topCategory = {
      categoryId,
      categoryName: categoryId ? categoryNames.get(categoryId) ?? "Kategori yok" : "Kategori yok",
      amount
    };
  }

  return { total, topCategory };
}

function buildCategoryInsights(transactions: Transaction[], categories: Category[], period: Period): CategoryInsights {
  const selectedTransactions = transactions.filter((transaction) => isTransactionInPeriod(transaction, period));
  const expense = buildTopCategory(selectedTransactions, categories, "expense");
  const income = buildTopCategory(selectedTransactions, categories, "income");

  return {
    selectedMonthIncome: income.total,
    selectedMonthExpense: expense.total,
    topExpenseCategory: expense.topCategory,
    topIncomeCategory: income.topCategory
  };
}

function isValidTopCategory(category: TopCategoryItem | null) {
  return Boolean(category && category.categoryName && Number.isFinite(category.amount) && category.amount > 0);
}

function CategoryInsightCard({
  category,
  periodLabel,
  title,
  totalAmount,
  totalLabel
}: {
  category: TopCategoryItem | null;
  periodLabel: string;
  title: string;
  totalAmount: number;
  totalLabel: string;
}) {
  const { formatCurrency } = useCurrencyFormatter();

  return (
    <section className="card insight-card">
      <p className="metric-label">{title}</p>
      <div className="insight-total">
        <span>{periodLabel} {totalLabel}</span>
        <strong>{formatCurrency(Number.isFinite(totalAmount) ? totalAmount : 0)}</strong>
      </div>
      {isValidTopCategory(category) ? (
        <>
          <p className="insight-title">{category?.categoryName}</p>
          <p className="insight-value">{formatCurrency(category?.amount ?? 0)}</p>
        </>
      ) : (
        <div className="empty-state">Bu ay veri yok</div>
      )}
    </section>
  );
}

export function DashboardPanel() {
  const { dashboardViewMode } = useDashboardViewMode();
  const { formatCurrency } = useCurrencyFormatter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownType>("expense");
  const [mainPanel, setMainPanel] = useState<MainPanel>("transactions");
  const [categoryPeriod, setCategoryPeriod] = useState<Period>(() => currentPeriod());
  const [status, setStatus] = useState<LoadStatus>("loading");

  const loadDashboard = useCallback(async () => {
    const { year, month } = currentPeriod();

    try {
      setStatus((current) => (current === "ready" ? "ready" : "loading"));
      const [analyticsSummaryResult, monthlySummary, incomeBreakdown, expenseBreakdown, transactions, categories, budgetSummary, budgets] =
        await Promise.all([
          apiGet<AnalyticsSummaryV2>(`/api/analytics/v2/summary?year=${year}&month=${month}`).catch(() => null),
          apiGet<MonthlySummary>("/api/analytics/monthly-summary"),
          apiGet<CategoryBreakdownItem[]>("/api/analytics/category-breakdown?type=income"),
          apiGet<CategoryBreakdownItem[]>("/api/analytics/category-breakdown?type=expense"),
          apiGet<Transaction[]>("/api/transactions"),
          apiGet<Category[]>("/api/categories"),
          apiGet<BudgetSummary>("/api/budgets/summary"),
          apiGet<Budget[]>("/api/budgets")
        ]);

      setData({
        analyticsSummary: analyticsSummaryResult ?? summaryFallback(monthlySummary),
        budgetSummary,
        budgets,
        categories,
        incomeBreakdown,
        expenseBreakdown,
        transactions
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    function refreshDashboard() {
      void loadDashboard();
    }

    window.addEventListener("focus", refreshDashboard);
    window.addEventListener("credentia:budgets-updated", refreshDashboard);
    window.addEventListener("credentia:transactions-updated", refreshDashboard);

    return () => {
      window.removeEventListener("focus", refreshDashboard);
      window.removeEventListener("credentia:budgets-updated", refreshDashboard);
      window.removeEventListener("credentia:transactions-updated", refreshDashboard);
    };
  }, [loadDashboard]);

  const categoryInsights = useMemo(
    () => buildCategoryInsights(data?.transactions ?? [], data?.categories ?? [], categoryPeriod),
    [categoryPeriod, data?.categories, data?.transactions]
  );

  if (status === "loading") {
    return <section className="card"><div className="state-card">Dashboard verileri yükleniyor.</div></section>;
  }

  if (status === "error" || !data) {
    return <section className="card"><div className="state-card error">Dashboard verileri alınamadı. Backend çalışıyor mu?</div></section>;
  }

  const activeBreakdown = selectedBreakdown === "income" ? data.incomeBreakdown : data.expenseBreakdown;
  const activeLabels = breakdownLabels[selectedBreakdown];
  const summary = data.analyticsSummary;
  const monthOptions = recentMonthOptions();
  const selectedPeriodLabel = formatMonthYear(categoryPeriod.month, categoryPeriod.year);
  const showDetailedAnalytics = dashboardViewMode === "detailed";

  return (
    <>
      <div className="grid metrics">
        <MetricCard
          changePercent={summary.incomeChangePercent}
          comparisonUnavailable={!hasComparisonData(summary.previousMonthIncome, summary.incomeChangePercent)}
          label="Toplam gelir"
          selected={selectedBreakdown === "income" && mainPanel === "transactions"}
          showComparison={showDetailedAnalytics}
          tone="positive"
          value={summary.selectedMonthIncome}
          onClick={() => {
            setSelectedBreakdown("income");
            setMainPanel("transactions");
          }}
        />
        <MetricCard
          changePercent={summary.expenseChangePercent}
          comparisonUnavailable={!hasComparisonData(summary.previousMonthExpense, summary.expenseChangePercent)}
          label="Toplam gider"
          selected={selectedBreakdown === "expense" && mainPanel === "transactions"}
          showComparison={showDetailedAnalytics}
          tone="negative"
          value={summary.selectedMonthExpense}
          onClick={() => {
            setSelectedBreakdown("expense");
            setMainPanel("transactions");
          }}
        />
        <MetricCard
          changePercent={summary.netBalanceChangePercent}
          comparisonUnavailable={!hasComparisonData(summary.previousMonthNetBalance, summary.netBalanceChangePercent)}
          label="Net bakiye"
          showComparison={showDetailedAnalytics}
          tone={summary.selectedMonthNetBalance >= 0 ? "positive" : "negative"}
          value={summary.selectedMonthNetBalance}
        />
        <MetricCard
          label="Bütçe kullanımı"
          selected={mainPanel === "budgets"}
          suffix="%"
          tone={data.budgetSummary.usage_percentage > 100 ? "negative" : "neutral"}
          value={Math.round(data.budgetSummary.usage_percentage)}
          onClick={() => setMainPanel("budgets")}
        />
      </div>

      {showDetailedAnalytics ? (
        <>
      <section className="card insight-controls" style={{ marginTop: 18 }}>
        <div>
          <h2>Kategori öne çıkanları</h2>
          <p className="muted">İşlemler sayfasındaki kayıtlar seçilen aya göre toplanır.</p>
        </div>
        <div className="insight-control-actions">
          <label className="field compact-field">
            <span>Ay</span>
            <select
              value={periodKey(categoryPeriod)}
              onChange={(event) => {
                const [year, month] = event.target.value.split("-").map(Number);
                setCategoryPeriod({ year, month });
              }}
            >
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={loadDashboard}>
            Yenile
          </button>
        </div>
      </section>

      <div className="grid insight-grid" style={{ marginTop: 18 }}>
        <CategoryInsightCard
          category={categoryInsights.topExpenseCategory}
          periodLabel={selectedPeriodLabel}
          title="En Çok Harcanan Kategori"
          totalAmount={categoryInsights.selectedMonthExpense}
          totalLabel="gideri"
        />
        <CategoryInsightCard
          category={categoryInsights.topIncomeCategory}
          periodLabel={selectedPeriodLabel}
          title="En Çok Gelir Gelen Kategori"
          totalAmount={categoryInsights.selectedMonthIncome}
          totalLabel="geliri"
        />
      </div>

        </>
      ) : null}

      <div className="grid content-grid" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>{mainPanel === "budgets" ? "Bütçe durumu" : "Son işlemler"}</h2>
          <div style={{ marginTop: 16 }}>
            {mainPanel === "budgets" ? (
              <BudgetList budgets={data.budgets} />
            ) : (
              <TransactionTable
                categories={data.categories}
                emptyMessage="Henüz işlem yok. İlk gelir veya giderini İşlemler sayfasından ekleyebilirsin."
                transactions={data.transactions.slice(0, 5)}
              />
            )}
          </div>
        </section>

        <section className="card">
          <h2>{activeLabels.title}</h2>
          {activeBreakdown.length === 0 ? (
            <div className="empty-state">{activeLabels.empty}</div>
          ) : (
            <>
              <CategoryChart data={activeBreakdown} />
              <div className="status-list">
                {activeBreakdown.map((item) => (
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
        </section>
      </div>
    </>
  );
}
