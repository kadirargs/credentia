"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { BudgetList } from "@/features/budgets/budget-list";
import type { Budget, BudgetSummary } from "@/features/budgets/types";
import type { Category } from "@/features/categories/types";
import { TransactionTable, type Transaction } from "@/features/transactions/transaction-table";
import { useCurrencyFormatter, useDashboardViewMode, useLanguage } from "@/components/theme/theme-provider";
import { apiGet } from "@/lib/api";
import { formatMonthYear } from "@/lib/format";

import { CategoryChart } from "./category-chart";
import { MetricCard } from "./metric-card";
import type { AnalyticsSummaryV2, CategoryBreakdownItem, TopCategoryItem } from "./types";

type BreakdownType = "income" | "expense";
type MainPanel = "transactions" | "budgets";
type LoadStatus = "loading" | "ready" | "error";

type Period = {
  year: number;
  month: number;
};

type DashboardPeriod = Period | "all";

type DashboardData = {
  budgetSummary: BudgetSummary;
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
};

type CategoryInsights = {
  selectedMonthIncome: number;
  selectedMonthExpense: number;
  topExpenseCategory: TopCategoryItem | null;
  topIncomeCategory: TopCategoryItem | null;
};

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

function dashboardPeriodOptions(language: "tr" | "en") {
  return [
    ...recentMonthOptions(language).map((option) => ({
      ...option,
      value: option.key
    })),
    {
      key: "all",
      label: language === "en" ? "All time" : "Tüm zaman",
      value: "all"
    }
  ];
}

function isAllPeriod(period: DashboardPeriod): period is "all" {
  return period === "all";
}

function periodKey(period: DashboardPeriod) {
  if (isAllPeriod(period)) return "all";
  return `${period.year}-${period.month}`;
}

function parsePeriodKey(value: string): DashboardPeriod {
  if (value === "all") return "all";
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function previousPeriod(period: Period): Period {
  if (period.month === 1) {
    return { year: period.year - 1, month: 12 };
  }

  return { year: period.year, month: period.month - 1 };
}

function periodLabel(period: DashboardPeriod, language: "tr" | "en") {
  if (isAllPeriod(period)) {
    return language === "en" ? "All time" : "Tüm zaman";
  }

  return formatMonthYear(period.month, period.year, language);
}

function isTransactionInPeriod(transaction: Transaction, period: Period) {
  const [year, month] = transaction.occurred_on.split("-").map(Number);
  return year === period.year && month === period.month;
}

function filterTransactionsByPeriod(transactions: Transaction[], period: DashboardPeriod) {
  if (isAllPeriod(period)) return transactions;
  return transactions.filter((transaction) => isTransactionInPeriod(transaction, period));
}

function hasComparisonData(previousValue: number, changePercent: number) {
  return previousValue !== 0 && Number.isFinite(previousValue) && Number.isFinite(changePercent);
}

function summarizeTransactions(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    const amount = Math.abs(Number(transaction.amount) || 0);
    if (transaction.type === "income") income += amount;
    if (transaction.type === "expense") expense += amount;
  }

  return {
    income,
    expense,
    balance: income - expense
  };
}

function safeChangePercent(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100;
}

function buildDashboardSummary(transactions: Transaction[], period: DashboardPeriod): AnalyticsSummaryV2 {
  const selected = summarizeTransactions(filterTransactionsByPeriod(transactions, period));
  const previous = isAllPeriod(period)
    ? { income: 0, expense: 0, balance: 0 }
    : summarizeTransactions(filterTransactionsByPeriod(transactions, previousPeriod(period)));

  return {
    selectedMonthIncome: selected.income,
    selectedMonthExpense: selected.expense,
    selectedMonthNetBalance: selected.balance,
    previousMonthIncome: previous.income,
    previousMonthExpense: previous.expense,
    previousMonthNetBalance: previous.balance,
    incomeChangePercent: safeChangePercent(selected.income, previous.income),
    expenseChangePercent: safeChangePercent(selected.expense, previous.expense),
    netBalanceChangePercent: safeChangePercent(selected.balance, previous.balance)
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

function buildCategoryInsights(transactions: Transaction[], categories: Category[], period: DashboardPeriod): CategoryInsights {
  const selectedTransactions = filterTransactionsByPeriod(transactions, period);
  const expense = buildTopCategory(selectedTransactions, categories, "expense");
  const income = buildTopCategory(selectedTransactions, categories, "income");

  return {
    selectedMonthIncome: income.total,
    selectedMonthExpense: expense.total,
    topExpenseCategory: expense.topCategory,
    topIncomeCategory: income.topCategory
  };
}

function buildCategoryBreakdown(transactions: Transaction[], categories: Category[], type: BreakdownType): CategoryBreakdownItem[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<number | null, number>();

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    const key = transaction.category_id ?? null;
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(Number(transaction.amount) || 0));
  }

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => {
      const category = categoryId ? categoryMap.get(categoryId) : null;

      return {
        category: category?.name ?? "Kategori yok",
        amount,
        color: category?.color ?? "#94A3B8"
      };
    })
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount);
}

function isValidTopCategory(category: TopCategoryItem | null) {
  return Boolean(category && category.categoryName && Number.isFinite(category.amount) && category.amount > 0);
}

function CategoryInsightCard({
  category,
  periodLabel,
  title,
  totalAmount,
  totalLabel,
  emptyLabel
}: {
  category: TopCategoryItem | null;
  periodLabel: string;
  title: string;
  totalAmount: number;
  totalLabel: string;
  emptyLabel: string;
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
        <div className="empty-state">{emptyLabel}</div>
      )}
    </section>
  );
}

export function DashboardPanel() {
  const { dashboardViewMode } = useDashboardViewMode();
  const { formatCurrency } = useCurrencyFormatter();
  const { language, t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownType>("expense");
  const [mainPanel, setMainPanel] = useState<MainPanel>("transactions");
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>(() => currentPeriod());
  const [status, setStatus] = useState<LoadStatus>("loading");

  const loadDashboard = useCallback(async () => {
    const budgetSummaryPath = isAllPeriod(dashboardPeriod)
      ? "/api/budgets/summary"
      : `/api/budgets/summary?year=${dashboardPeriod.year}&month=${dashboardPeriod.month}`;

    try {
      setStatus((current) => (current === "ready" ? "ready" : "loading"));
      const [transactions, categories, budgetSummary, budgets] =
        await Promise.all([
          apiGet<Transaction[]>("/api/transactions"),
          apiGet<Category[]>("/api/categories"),
          apiGet<BudgetSummary>(budgetSummaryPath),
          apiGet<Budget[]>("/api/budgets")
        ]);

      setData({
        budgetSummary,
        budgets,
        categories,
        transactions
      });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [dashboardPeriod]);

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
    () => buildCategoryInsights(data?.transactions ?? [], data?.categories ?? [], dashboardPeriod),
    [dashboardPeriod, data?.categories, data?.transactions]
  );

  if (status === "loading") {
    return <section className="card"><div className="state-card">{t("dashboard.loading")}</div></section>;
  }

  if (status === "error" || !data) {
    return <section className="card"><div className="state-card error">{t("dashboard.error")}</div></section>;
  }

  const selectedTransactions = filterTransactionsByPeriod(data.transactions, dashboardPeriod);
  const incomeBreakdown = buildCategoryBreakdown(selectedTransactions, data.categories, "income");
  const expenseBreakdown = buildCategoryBreakdown(selectedTransactions, data.categories, "expense");
  const activeBreakdown = selectedBreakdown === "income" ? incomeBreakdown : expenseBreakdown;
  const activeTitle = selectedBreakdown === "income" ? t("dashboard.incomeDistribution") : t("dashboard.expenseDistribution");
  const activeEmpty = selectedBreakdown === "income" ? t("dashboard.noIncomeCategory") : t("dashboard.noExpenseCategory");
  const summary = buildDashboardSummary(data.transactions, dashboardPeriod);
  const periodOptions = dashboardPeriodOptions(language);
  const selectedPeriodLabel = periodLabel(dashboardPeriod, language);
  const showDetailedAnalytics = dashboardViewMode === "detailed";
  const showMonthlyComparison = showDetailedAnalytics && !isAllPeriod(dashboardPeriod);

  return (
    <>
      <section className="card insight-controls dashboard-period-controls" style={{ marginBottom: 18 }}>
        <div>
          <h2>{t("dashboard.overviewPeriod")}</h2>
          <p className="muted">{t("dashboard.overviewPeriodDescription")}</p>
        </div>
        <div className="insight-control-actions">
          <label className="field compact-field">
            <span>{t("common.month")}</span>
            <select value={periodKey(dashboardPeriod)} onChange={(event) => setDashboardPeriod(parsePeriodKey(event.target.value))}>
              {periodOptions.map((option) => (
                <option key={option.key} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={loadDashboard}>
            {t("common.refresh")}
          </button>
        </div>
      </section>

      <div className="grid metrics">
        <MetricCard
          changePercent={summary.incomeChangePercent}
          comparisonUnavailable={!hasComparisonData(summary.previousMonthIncome, summary.incomeChangePercent)}
          label={t("dashboard.totalIncome")}
          selected={selectedBreakdown === "income" && mainPanel === "transactions"}
          showComparison={showMonthlyComparison}
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
          label={t("dashboard.totalExpense")}
          selected={selectedBreakdown === "expense" && mainPanel === "transactions"}
          showComparison={showMonthlyComparison}
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
          label={t("dashboard.netBalance")}
          showComparison={showMonthlyComparison}
          tone={summary.selectedMonthNetBalance >= 0 ? "positive" : "negative"}
          value={summary.selectedMonthNetBalance}
        />
        <MetricCard
          label={t("dashboard.budgetUsage")}
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
          <h2>{t("dashboard.categoryHighlights")}</h2>
          <p className="muted">{t("dashboard.categoryHighlightsDescription")}</p>
        </div>
        <div className="insight-control-actions">
          <button className="secondary-button" type="button" onClick={loadDashboard}>
            {t("common.refresh")}
          </button>
        </div>
      </section>

      <div className="grid insight-grid" style={{ marginTop: 18 }}>
        <CategoryInsightCard
          category={categoryInsights.topExpenseCategory}
          periodLabel={selectedPeriodLabel}
          title={t("dashboard.topExpenseCategory")}
          totalAmount={categoryInsights.selectedMonthExpense}
          totalLabel={t("dashboard.selectedMonthExpense")}
          emptyLabel={t("dashboard.noDataThisMonth")}
        />
        <CategoryInsightCard
          category={categoryInsights.topIncomeCategory}
          periodLabel={selectedPeriodLabel}
          title={t("dashboard.topIncomeCategory")}
          totalAmount={categoryInsights.selectedMonthIncome}
          totalLabel={t("dashboard.selectedMonthIncome")}
          emptyLabel={t("dashboard.noDataThisMonth")}
        />
      </div>

        </>
      ) : null}

      <div className="grid content-grid" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>{mainPanel === "budgets" ? t("dashboard.budgetStatus") : t("dashboard.recentTransactions")}</h2>
          <div style={{ marginTop: 16 }}>
            {mainPanel === "budgets" ? (
              <BudgetList budgets={data.budgets} />
            ) : (
              <TransactionTable
                categories={data.categories}
                emptyMessage={t("dashboard.noTransactions")}
                transactions={selectedTransactions.slice(0, 5)}
              />
            )}
          </div>
        </section>

        <section className="card">
          <h2>{activeTitle}</h2>
          {activeBreakdown.length === 0 ? (
            <div className="empty-state">{activeEmpty}</div>
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
