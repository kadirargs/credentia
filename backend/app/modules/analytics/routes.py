from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.modules.analytics.service import build_category_summary, build_summary
from app.schemas.analytics import AnalyticsCategoriesV2, AnalyticsSummaryV2, CategoryBreakdownItem, MonthlySummary
from app.services.single_user import ensure_single_user

router = APIRouter()


@router.get("/v2/summary", response_model=AnalyticsSummaryV2)
def summary_v2(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
) -> AnalyticsSummaryV2:
    user = ensure_single_user(db)
    return build_summary(db, user.id, year, month)


@router.get("/v2/categories", response_model=AnalyticsCategoriesV2)
def categories_v2(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
) -> AnalyticsCategoriesV2:
    user = ensure_single_user(db)
    return build_category_summary(db, user.id, year, month)


@router.get("/monthly-summary", response_model=MonthlySummary)
def monthly_summary(db: Session = Depends(get_db)) -> MonthlySummary:
    user = ensure_single_user(db)
    income = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == user.id,
            Transaction.type == TransactionType.income,
        )
    )
    expense = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == user.id,
            Transaction.type == TransactionType.expense,
        )
    )
    return MonthlySummary(income=float(income), expense=float(expense), balance=float(income - expense))


@router.get("/category-breakdown", response_model=list[CategoryBreakdownItem])
def category_breakdown(
    type: TransactionType = TransactionType.expense,
    db: Session = Depends(get_db),
) -> list[CategoryBreakdownItem]:
    user = ensure_single_user(db)
    statement = (
        select(Category.name, Category.color, func.coalesce(func.sum(Transaction.amount), 0))
        .join(Transaction, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == user.id,
            Transaction.type == type,
            Category.user_id == user.id,
            Category.type == type.value,
        )
        .group_by(Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
    )
    return [
        CategoryBreakdownItem(category=name, color=color, amount=float(amount))
        for name, color, amount in db.execute(statement).all()
    ]
