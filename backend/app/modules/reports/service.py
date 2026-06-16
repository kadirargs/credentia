from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.modules.analytics.service import month_range, monthly_totals


@dataclass(frozen=True)
class ReportSummary:
    income: float
    expense: float
    balance: float


@dataclass(frozen=True)
class ReportCategoryTotal:
    category: str
    type: TransactionType
    amount: float
    color: str


@dataclass(frozen=True)
class ReportTransaction:
    occurred_on: date
    description: str
    category: str
    type: TransactionType
    amount: float


@dataclass(frozen=True)
class ReportData:
    year: int
    month: int
    summary: ReportSummary
    income_categories: list[ReportCategoryTotal]
    expense_categories: list[ReportCategoryTotal]
    transactions: list[ReportTransaction]


def build_report_data(db: Session, user_id: int, year: int, month: int) -> ReportData:
    start_date, end_date = month_range(year, month)
    income, expense, balance = monthly_totals(db, user_id, year, month)
    category_amount = func.coalesce(func.sum(Transaction.amount), 0)

    category_rows = db.execute(
        select(
            Transaction.type,
            func.coalesce(Category.name, "Kategori yok"),
            func.coalesce(Category.color, "#64748b"),
            category_amount.label("amount"),
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == user_id,
            Transaction.occurred_on >= start_date,
            Transaction.occurred_on < end_date,
        )
        .group_by(Transaction.type, Category.name, Category.color)
        .order_by(Transaction.type.asc(), category_amount.desc())
    ).all()

    income_categories: list[ReportCategoryTotal] = []
    expense_categories: list[ReportCategoryTotal] = []
    for transaction_type, category_name, category_color, amount in category_rows:
        item = ReportCategoryTotal(
            category=category_name or "Kategori yok",
            type=transaction_type,
            amount=float(amount or 0),
            color=category_color or "#64748b",
        )
        if transaction_type == TransactionType.income:
            income_categories.append(item)
        else:
            expense_categories.append(item)

    transaction_rows = db.execute(
        select(
            Transaction.occurred_on,
            Transaction.description,
            func.coalesce(Category.name, "Kategori yok"),
            Transaction.type,
            Transaction.amount,
        )
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == user_id,
            Transaction.occurred_on >= start_date,
            Transaction.occurred_on < end_date,
        )
        .order_by(Transaction.occurred_on.desc(), Transaction.id.desc())
    ).all()

    transactions = [
        ReportTransaction(
            occurred_on=occurred_on,
            description=(description or "").strip() or "Açıklama yok",
            category=category_name or "Kategori yok",
            type=transaction_type,
            amount=float(amount or 0),
        )
        for occurred_on, description, category_name, transaction_type, amount in transaction_rows
    ]

    return ReportData(
        year=year,
        month=month,
        summary=ReportSummary(income=income, expense=expense, balance=balance),
        income_categories=income_categories,
        expense_categories=expense_categories,
        transactions=transactions,
    )


def report_to_dict(report: ReportData) -> dict[str, object]:
    return {
        "summary": {
            "income": report.summary.income,
            "expense": report.summary.expense,
            "balance": report.summary.balance,
        },
        "income_breakdown": [
            {"category": item.category, "amount": item.amount, "color": item.color}
            for item in report.income_categories
        ],
        "expense_breakdown": [
            {"category": item.category, "amount": item.amount, "color": item.color}
            for item in report.expense_categories
        ],
        "transactions": [
            {
                "occurred_on": item.occurred_on.isoformat(),
                "description": item.description,
                "category": item.category,
                "type": item.type.value,
                "amount": item.amount,
            }
            for item in report.transactions
        ],
    }
