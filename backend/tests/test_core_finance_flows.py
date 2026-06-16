from datetime import date

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.modules.budgets.routes import create_budget, list_budgets
from app.modules.categories.routes import create_category, delete_category
from app.modules.transactions.routes import create_transaction
from app.schemas.budget import BudgetCreate
from app.schemas.category import CategoryCreate
from app.schemas.transaction import TransactionCreate


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_category_name_is_trimmed_and_blank_rejected():
    payload = CategoryCreate(name="  Market  ", type=TransactionType.expense, color="  #123456  ")

    assert payload.name == "Market"
    assert payload.color == "#123456"

    with pytest.raises(ValidationError):
        CategoryCreate(name="   ", type=TransactionType.expense, color="#123456")


def test_duplicate_category_name_is_rejected_before_database_error(db_session):
    create_category(
        CategoryCreate(name="Market", type=TransactionType.expense, color="#0f766e"),
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        create_category(
            CategoryCreate(name="Market", type=TransactionType.income, color="#2563eb"),
            db_session,
        )

    assert exc_info.value.status_code == 409


def test_transaction_requires_category_and_trims_description():
    payload = TransactionCreate(
        type=TransactionType.expense,
        amount=25,
        occurred_on=date(2026, 6, 15),
        category_id=1,
        description="  Market alisverisi  ",
    )

    assert payload.description == "Market alisverisi"

    with pytest.raises(ValidationError):
        TransactionCreate(
            type=TransactionType.expense,
            amount=25,
            occurred_on=date(2026, 6, 15),
            description="Kategorisiz islem",
        )


def test_finance_flow_rejects_wrong_category_type_and_updates_budget_spend(db_session):
    expense_category = create_category(
        CategoryCreate(name="Market", type=TransactionType.expense, color="#0f766e"),
        db_session,
    )
    income_category = create_category(
        CategoryCreate(name="Maas", type=TransactionType.income, color="#2563eb"),
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        create_transaction(
            TransactionCreate(
                type=TransactionType.expense,
                amount=100,
                occurred_on=date(2026, 6, 15),
                category_id=income_category.id,
                description="Yanlis kategori",
            ),
            db_session,
        )
    assert exc_info.value.status_code == 400

    transaction = create_transaction(
        TransactionCreate(
            type=TransactionType.expense,
            amount=250,
            occurred_on=date(2026, 6, 15),
            category_id=expense_category.id,
            description="Market",
        ),
        db_session,
    )
    budget = create_budget(
        BudgetCreate(category_id=expense_category.id, limit_amount=1000, month=6, year=2026),
        db_session,
    )

    assert transaction.category_id == expense_category.id
    assert budget.spent_amount == 250
    assert budget.remaining_amount == 750
    assert budget.usage_percentage == 25


def test_deleting_category_removes_related_transactions_and_budgets(db_session):
    category = create_category(
        CategoryCreate(name="Yemek", type=TransactionType.expense, color="#b7791f"),
        db_session,
    )
    create_transaction(
        TransactionCreate(
            type=TransactionType.expense,
            amount=80,
            occurred_on=date(2026, 6, 15),
            category_id=category.id,
            description="Yemek",
        ),
        db_session,
    )
    create_budget(
        BudgetCreate(category_id=category.id, limit_amount=400, month=6, year=2026),
        db_session,
    )

    delete_category(category.id, db_session)

    assert db_session.scalar(select(Category).where(Category.id == category.id)) is None
    assert db_session.scalars(select(Transaction)).all() == []
    assert db_session.scalars(select(Budget)).all() == []
    assert list_budgets(db_session) == []
    assert db_session.scalars(select(User)).all()
