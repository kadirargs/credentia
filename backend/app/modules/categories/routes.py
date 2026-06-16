from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.single_user import ensure_single_user

router = APIRouter()


def get_user_category(db: Session, user_id: int, category_id: int) -> Category:
    category = db.scalar(select(Category).where(Category.id == category_id, Category.user_id == user_id))
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def ensure_unique_category_name(db: Session, user_id: int, payload: CategoryCreate | CategoryUpdate, category_id: int | None = None) -> None:
    statement = select(Category).where(
        Category.user_id == user_id,
        Category.name == payload.name,
    )
    if category_id is not None:
        statement = statement.where(Category.id != category_id)

    if db.scalar(statement):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    user = ensure_single_user(db)
    return list(db.scalars(select(Category).where(Category.user_id == user.id).order_by(Category.name)))


@router.post("", response_model=CategoryRead, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    user = ensure_single_user(db)
    ensure_unique_category_name(db, user.id, payload)

    category = Category(
        user_id=user.id,
        name=payload.name,
        type=payload.type.value,
        color=payload.color,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)) -> Category:
    user = ensure_single_user(db)
    category = get_user_category(db, user.id, category_id)
    ensure_unique_category_name(db, user.id, payload, category_id=category.id)

    if category.type != payload.type.value:
        has_transactions = db.scalar(select(Transaction.id).where(Transaction.user_id == user.id, Transaction.category_id == category.id).limit(1))
        has_budgets = db.scalar(select(Budget.id).where(Budget.user_id == user.id, Budget.category_id == category.id).limit(1))
        if has_transactions or has_budgets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category type cannot be changed while it has transactions or budgets",
            )

    category.name = payload.name
    category.type = payload.type.value
    category.color = payload.color
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)) -> None:
    user = ensure_single_user(db)
    category = get_user_category(db, user.id, category_id)

    db.execute(delete(Transaction).where(Transaction.user_id == user.id, Transaction.category_id == category.id))
    db.execute(delete(Budget).where(Budget.user_id == user.id, Budget.category_id == category.id))
    db.delete(category)
    db.commit()
