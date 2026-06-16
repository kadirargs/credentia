export type MonthlySummary = {
  income: number;
  expense: number;
  balance: number;
};

export type CategoryBreakdownItem = {
  category: string;
  amount: number;
  color: string;
};

export type AnalyticsSummaryV2 = {
  selectedMonthIncome: number;
  selectedMonthExpense: number;
  selectedMonthNetBalance: number;
  previousMonthIncome: number;
  previousMonthExpense: number;
  previousMonthNetBalance: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  netBalanceChangePercent: number;
};

export type TopCategoryItem = {
  categoryId: number | null;
  categoryName: string;
  amount: number;
};

export type AnalyticsCategoriesV2 = {
  selectedMonthIncome: number;
  selectedMonthExpense: number;
  topExpenseCategory: TopCategoryItem | null;
  topIncomeCategory: TopCategoryItem | null;
};
