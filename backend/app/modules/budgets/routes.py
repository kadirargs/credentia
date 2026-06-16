from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.schemas.budget import BudgetCreate, BudgetRead, BudgetSummary, BudgetUpdate
from app.services.single_user import ensure_single_user

router = APIRouter()


def get_user_budget(db: Session, user_id: int, budget_id: int) -> Budget:
    budget = db.scalar(select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id))
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


def validate_expense_category(db: Session, user_id: int, category_id: int) -> None:
    category = db.scalar(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == user_id,
            Category.type == TransactionType.expense.value,
        )
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid expense category")


def ensure_unique_budget_period(
    db: Session,
    user_id: int,
    payload: BudgetCreate | BudgetUpdate,
    budget_id: int | None = None,
) -> None:
    statement = select(Budget).where(
        Budget.user_id == user_id,
        Budget.category_id == payload.category_id,
        Budget.month == payload.month,
        Budget.year == payload.year,
    )
    if budget_id is not None:
        statement = statement.where(Budget.id != budget_id)

    if db.scalar(statement):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Budget already exists for this period")


def calculate_spent(db: Session, user_id: int, category_id: int, month: int, year: int) -> float:
    spent = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.type == TransactionType.expense,
            extract("month", Transaction.occurred_on) == month,
            extract("year", Transaction.occurred_on) == year,
        )
    )
    return float(spent)


def to_budget_read(db: Session, budget: Budget) -> BudgetRead:
    spent = calculate_spent(db, budget.user_id, budget.category_id, budget.month, budget.year)
    limit_amount = float(budget.limit_amount)
    remaining = limit_amount - spent
    usage = round((spent / limit_amount) * 100, 2) if limit_amount > 0 else 0

    return BudgetRead(
        id=budget.id,
        category_id=budget.category_id,
        category_name=budget.category.name,
        category_color=budget.category.color,
        limit_amount=limit_amount,
        spent_amount=spent,
        remaining_amount=remaining,
        usage_percentage=usage,
        month=budget.month,
        year=budget.year,
    )


@router.get("", response_model=list[BudgetRead])
def list_budgets(db: Session = Depends(get_db)) -> list[BudgetRead]:
    user = ensure_single_user(db)
    statement = (
        select(Budget)
        .join(Category, Category.id == Budget.category_id)
        .where(Budget.user_id == user.id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Category.name.asc())
    )
    return [to_budget_read(db, budget) for budget in db.scalars(statement).all()]


@router.post("", response_model=BudgetRead, status_code=201)
def create_budget(payload: BudgetCreate, db: Session = Depends(get_db)) -> BudgetRead:
    user = ensure_single_user(db)
    validate_expense_category(db, user.id, payload.category_id)
    ensure_unique_budget_period(db, user.id, payload)

    budget = Budget(user_id=user.id, **payload.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return to_budget_read(db, budget)


@router.put("/{budget_id}", response_model=BudgetRead)
def update_budget(budget_id: int, payload: BudgetUpdate, db: Session = Depends(get_db)) -> BudgetRead:
    user = ensure_single_user(db)
    budget = get_user_budget(db, user.id, budget_id)
    validate_expense_category(db, user.id, payload.category_id)
    ensure_unique_budget_period(db, user.id, payload, budget_id=budget.id)

    budget.category_id = payload.category_id
    budget.limit_amount = payload.limit_amount
    budget.month = payload.month
    budget.year = payload.year
    db.commit()
    db.refresh(budget)
    return to_budget_read(db, budget)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db)) -> None:
    user = ensure_single_user(db)
    budget = get_user_budget(db, user.id, budget_id)
    db.delete(budget)
    db.commit()


@router.get("/summary", response_model=BudgetSummary)
def budget_summary(month: int | None = None, year: int | None = None, db: Session = Depends(get_db)) -> BudgetSummary:
    user = ensure_single_user(db)
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    budgets = list(
        db.scalars(
            select(Budget).where(
                Budget.user_id == user.id,
                Budget.month == target_month,
                Budget.year == target_year,
            )
        )
    )
    limit_amount = sum(float(budget.limit_amount) for budget in budgets)
    spent_amount = sum(calculate_spent(db, user.id, budget.category_id, target_month, target_year) for budget in budgets)
    remaining_amount = limit_amount - spent_amount
    usage_percentage = round((spent_amount / limit_amount) * 100, 2) if limit_amount > 0 else 0

    return BudgetSummary(
        limit_amount=limit_amount,
        spent_amount=spent_amount,
        remaining_amount=remaining_amount,
        usage_percentage=usage_percentage,
        month=target_month,
        year=target_year,
    )
