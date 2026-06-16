from pydantic import BaseModel


class MonthlySummary(BaseModel):
    income: float
    expense: float
    balance: float


class CategoryBreakdownItem(BaseModel):
    category: str
    amount: float
    color: str


class AnalyticsSummaryV2(BaseModel):
    selectedMonthIncome: float
    selectedMonthExpense: float
    selectedMonthNetBalance: float
    previousMonthIncome: float
    previousMonthExpense: float
    previousMonthNetBalance: float
    incomeChangePercent: float
    expenseChangePercent: float
    netBalanceChangePercent: float


class TopCategoryItem(BaseModel):
    categoryId: int | None
    categoryName: str
    amount: float


class AnalyticsCategoriesV2(BaseModel):
    selectedMonthIncome: float
    selectedMonthExpense: float
    topExpenseCategory: TopCategoryItem | None
    topIncomeCategory: TopCategoryItem | None
