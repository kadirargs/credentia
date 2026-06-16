from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.schemas.analytics import AnalyticsCategoriesV2, AnalyticsSummaryV2, TopCategoryItem


def previous_month(year: int, month: int) -> tuple[int, int]:
    if month == 1:
        return year - 1, 12
    return year, month - 1


def next_month(year: int, month: int) -> tuple[int, int]:
    if month == 12:
        return year + 1, 1
    return year, month + 1


def month_range(year: int, month: int) -> tuple[date, date]:
    next_year, next_month_value = next_month(year, month)
    return date(year, month, 1), date(next_year, next_month_value, 1)


def safe_change_percent(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0

    return round(((current - previous) / abs(previous)) * 100, 2)


def monthly_totals(db: Session, user_id: int, year: int, month: int) -> tuple[float, float, float]:
    start_date, end_date = month_range(year, month)
    rows = db.execute(
        select(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.user_id == user_id,
            Transaction.occurred_on >= start_date,
            Transaction.occurred_on < end_date,
        )
        .group_by(Transaction.type)
    ).all()

    totals = {transaction_type: float(amount) for transaction_type, amount in rows}
    income = totals.get(TransactionType.income, 0.0)
    expense = totals.get(TransactionType.expense, 0.0)
    return income, expense, income - expense


def build_summary(db: Session, user_id: int, year: int, month: int) -> AnalyticsSummaryV2:
    selected_income, selected_expense, selected_balance = monthly_totals(db, user_id, year, month)
    previous_year, previous_month_value = previous_month(year, month)
    previous_income, previous_expense, previous_balance = monthly_totals(
        db,
        user_id,
        previous_year,
        previous_month_value,
    )

    return AnalyticsSummaryV2(
        selectedMonthIncome=selected_income,
        selectedMonthExpense=selected_expense,
        selectedMonthNetBalance=selected_balance,
        previousMonthIncome=previous_income,
        previousMonthExpense=previous_expense,
        previousMonthNetBalance=previous_balance,
        incomeChangePercent=safe_change_percent(selected_income, previous_income),
        expenseChangePercent=safe_change_percent(selected_expense, previous_expense),
        netBalanceChangePercent=safe_change_percent(selected_balance, previous_balance),
    )


def top_category_for_type(
    db: Session,
    user_id: int,
    year: int,
    month: int,
    transaction_type: TransactionType,
) -> TopCategoryItem | None:
    start_date, end_date = month_range(year, month)
    total_amount = func.coalesce(func.sum(func.abs(Transaction.amount)), 0)
    row = db.execute(
        select(Transaction.category_id, Category.name, total_amount.label("amount"))
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == user_id,
            Transaction.type == transaction_type,
            Transaction.occurred_on >= start_date,
            Transaction.occurred_on < end_date,
        )
        .group_by(Transaction.category_id, Category.name)
        .order_by(total_amount.desc())
        .limit(1)
    ).first()

    if row is None:
        return None

    category_id, category_name, amount = row
    amount_value = float(amount or 0)
    if amount_value <= 0:
        return None

    return TopCategoryItem(
        categoryId=category_id,
        categoryName=category_name or "Kategori yok",
        amount=amount_value,
    )


def build_category_summary(db: Session, user_id: int, year: int, month: int) -> AnalyticsCategoriesV2:
    selected_income, selected_expense, _selected_balance = monthly_totals(db, user_id, year, month)

    return AnalyticsCategoriesV2(
        selectedMonthIncome=selected_income,
        selectedMonthExpense=selected_expense,
        topExpenseCategory=top_category_for_type(db, user_id, year, month, TransactionType.expense),
        topIncomeCategory=top_category_for_type(db, user_id, year, month, TransactionType.income),
    )
