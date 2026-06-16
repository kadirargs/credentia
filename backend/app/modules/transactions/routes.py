from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionBulkDelete, TransactionCreate, TransactionRead, TransactionUpdate
from app.services.single_user import ensure_single_user

router = APIRouter()


def get_user_transaction(db: Session, user_id: int, transaction_id: int) -> Transaction:
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user_id))
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


def validate_category(db: Session, user_id: int, payload: TransactionCreate | TransactionUpdate) -> None:
    if payload.category_id is None:
        return

    category = db.scalar(
        select(Category).where(
            Category.id == payload.category_id,
            Category.user_id == user_id,
            Category.type == payload.type.value,
        )
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")


@router.get("", response_model=list[TransactionRead])
def list_transactions(db: Session = Depends(get_db)) -> list[Transaction]:
    user = ensure_single_user(db)
    statement = (
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
    )
    return list(db.scalars(statement))


@router.post("", response_model=TransactionRead, status_code=201)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)) -> Transaction:
    user = ensure_single_user(db)
    validate_category(db, user.id, payload)

    transaction = Transaction(user_id=user.id, **payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.post("/bulk-delete", response_model=dict[str, int])
def bulk_delete_transactions(payload: TransactionBulkDelete, db: Session = Depends(get_db)) -> dict[str, int]:
    user = ensure_single_user(db)
    transactions = list(
        db.scalars(
            select(Transaction).where(
                Transaction.user_id == user.id,
                Transaction.id.in_(payload.ids),
            )
        )
    )
    for transaction in transactions:
        db.delete(transaction)
    db.commit()
    return {"deleted": len(transactions)}


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
) -> Transaction:
    user = ensure_single_user(db)
    transaction = get_user_transaction(db, user.id, transaction_id)
    validate_category(db, user.id, payload)

    for field, value in payload.model_dump().items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)) -> None:
    user = ensure_single_user(db)
    transaction = get_user_transaction(db, user.id, transaction_id)
    db.delete(transaction)
    db.commit()
