from __future__ import annotations

import sys
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal  # noqa: E402
from app.models.category import Category  # noqa: E402
from app.models.transaction import Transaction, TransactionType  # noqa: E402
from app.services.single_user import ensure_single_user  # noqa: E402


@dataclass(frozen=True)
class DemoTransaction:
    occurred_on: date
    type: TransactionType
    amount: Decimal
    category_name: str
    description: str


@dataclass
class SeedResult:
    inserted: int = 0
    updated: int = 0
    skipped: int = 0


DEMO_CATEGORY_DEFINITIONS: dict[str, tuple[TransactionType, str]] = {
    "Maaş": (TransactionType.income, "#16A34A"),
    "Freelance": (TransactionType.income, "#22C55E"),
    "Aile desteği": (TransactionType.income, "#84CC16"),
    "Ek gelir": (TransactionType.income, "#14B8A6"),
    "Market": (TransactionType.expense, "#F97316"),
    "Yemek": (TransactionType.expense, "#EF4444"),
    "Ulaşım": (TransactionType.expense, "#3B82F6"),
    "Kira": (TransactionType.expense, "#8B5CF6"),
    "Faturalar": (TransactionType.expense, "#06B6D4"),
    "Eğitim": (TransactionType.expense, "#6366F1"),
    "Eğlence": (TransactionType.expense, "#EC4899"),
    "Alışveriş": (TransactionType.expense, "#F59E0B"),
    "Abonelikler": (TransactionType.expense, "#64748B"),
    "Sağlık": (TransactionType.expense, "#10B981"),
}


DEMO_TRANSACTIONS: tuple[DemoTransaction, ...] = (
    # April 2026 income: 30,180
    DemoTransaction(date(2026, 4, 1), TransactionType.income, Decimal("26540.00"), "Maaş", "Aylık maaş"),
    DemoTransaction(date(2026, 4, 13), TransactionType.income, Decimal("2430.00"), "Freelance", "Freelance iş geliri"),
    DemoTransaction(date(2026, 4, 24), TransactionType.income, Decimal("1210.00"), "Ek gelir", "Ek gelir"),
    # April 2026 expenses: 22,105
    DemoTransaction(date(2026, 4, 2), TransactionType.expense, Decimal("9100.00"), "Kira", "Kira ödemesi"),
    DemoTransaction(date(2026, 4, 3), TransactionType.expense, Decimal("1240.00"), "Market", "Haftalık market alışverişi"),
    DemoTransaction(date(2026, 4, 4), TransactionType.expense, Decimal("310.00"), "Ulaşım", "Otobüs kartı yükleme"),
    DemoTransaction(date(2026, 4, 5), TransactionType.expense, Decimal("420.00"), "Yemek", "Dışarıda yemek"),
    DemoTransaction(date(2026, 4, 6), TransactionType.expense, Decimal("725.00"), "Faturalar", "Elektrik faturası"),
    DemoTransaction(date(2026, 4, 7), TransactionType.expense, Decimal("690.00"), "Market", "Market alışverişi"),
    DemoTransaction(date(2026, 4, 8), TransactionType.expense, Decimal("280.00"), "Abonelikler", "Spotify aboneliği"),
    DemoTransaction(date(2026, 4, 10), TransactionType.expense, Decimal("510.00"), "Yemek", "Arkadaşlarla yemek"),
    DemoTransaction(date(2026, 4, 11), TransactionType.expense, Decimal("870.00"), "Faturalar", "Doğalgaz faturası"),
    DemoTransaction(date(2026, 4, 12), TransactionType.expense, Decimal("1185.00"), "Alışveriş", "Giyim alışverişi"),
    DemoTransaction(date(2026, 4, 14), TransactionType.expense, Decimal("940.00"), "Market", "Ev alışverişi"),
    DemoTransaction(date(2026, 4, 15), TransactionType.expense, Decimal("610.00"), "Faturalar", "İnternet faturası"),
    DemoTransaction(date(2026, 4, 16), TransactionType.expense, Decimal("350.00"), "Ulaşım", "Taksi ücreti"),
    DemoTransaction(date(2026, 4, 18), TransactionType.expense, Decimal("760.00"), "Eğitim", "Online kurs ödemesi"),
    DemoTransaction(date(2026, 4, 19), TransactionType.expense, Decimal("540.00"), "Yemek", "Dışarıda kahvaltı"),
    DemoTransaction(date(2026, 4, 20), TransactionType.expense, Decimal("845.00"), "Market", "Market alışverişi"),
    DemoTransaction(date(2026, 4, 21), TransactionType.expense, Decimal("430.00"), "Sağlık", "Eczane alışverişi"),
    DemoTransaction(date(2026, 4, 23), TransactionType.expense, Decimal("360.00"), "Eğlence", "Sinema"),
    DemoTransaction(date(2026, 4, 25), TransactionType.expense, Decimal("520.00"), "Yemek", "Öğle yemeği"),
    DemoTransaction(date(2026, 4, 27), TransactionType.expense, Decimal("1090.00"), "Alışveriş", "Ev ihtiyaçları"),
    DemoTransaction(date(2026, 4, 28), TransactionType.expense, Decimal("290.00"), "Ulaşım", "Toplu taşıma yükleme"),
    # May 2026 income: 32,250
    DemoTransaction(date(2026, 5, 1), TransactionType.income, Decimal("27850.00"), "Maaş", "Aylık maaş"),
    DemoTransaction(date(2026, 5, 12), TransactionType.income, Decimal("2980.00"), "Freelance", "Freelance iş geliri"),
    DemoTransaction(date(2026, 5, 23), TransactionType.income, Decimal("1420.00"), "Aile desteği", "Aile desteği"),
    # May 2026 expenses: 23,635
    DemoTransaction(date(2026, 5, 2), TransactionType.expense, Decimal("9650.00"), "Kira", "Kira ödemesi"),
    DemoTransaction(date(2026, 5, 3), TransactionType.expense, Decimal("1320.00"), "Market", "Haftalık market alışverişi"),
    DemoTransaction(date(2026, 5, 4), TransactionType.expense, Decimal("340.00"), "Ulaşım", "Otobüs kartı yükleme"),
    DemoTransaction(date(2026, 5, 5), TransactionType.expense, Decimal("480.00"), "Yemek", "Dışarıda yemek"),
    DemoTransaction(date(2026, 5, 6), TransactionType.expense, Decimal("790.00"), "Faturalar", "Elektrik faturası"),
    DemoTransaction(date(2026, 5, 7), TransactionType.expense, Decimal("735.00"), "Market", "Market alışverişi"),
    DemoTransaction(date(2026, 5, 8), TransactionType.expense, Decimal("299.00"), "Abonelikler", "Dijital abonelik ödemesi"),
    DemoTransaction(date(2026, 5, 9), TransactionType.expense, Decimal("620.00"), "Yemek", "Akşam yemeği"),
    DemoTransaction(date(2026, 5, 10), TransactionType.expense, Decimal("930.00"), "Faturalar", "Doğalgaz faturası"),
    DemoTransaction(date(2026, 5, 11), TransactionType.expense, Decimal("1260.00"), "Alışveriş", "Giyim alışverişi"),
    DemoTransaction(date(2026, 5, 13), TransactionType.expense, Decimal("980.00"), "Market", "Ev alışverişi"),
    DemoTransaction(date(2026, 5, 14), TransactionType.expense, Decimal("640.00"), "Faturalar", "İnternet faturası"),
    DemoTransaction(date(2026, 5, 16), TransactionType.expense, Decimal("390.00"), "Ulaşım", "Taksi ücreti"),
    DemoTransaction(date(2026, 5, 17), TransactionType.expense, Decimal("880.00"), "Eğitim", "Online kurs ödemesi"),
    DemoTransaction(date(2026, 5, 18), TransactionType.expense, Decimal("560.00"), "Yemek", "Dışarıda kahvaltı"),
    DemoTransaction(date(2026, 5, 19), TransactionType.expense, Decimal("910.00"), "Market", "Market alışverişi"),
    DemoTransaction(date(2026, 5, 20), TransactionType.expense, Decimal("520.00"), "Sağlık", "Sağlık harcaması"),
    DemoTransaction(date(2026, 5, 22), TransactionType.expense, Decimal("430.00"), "Eğlence", "Sinema"),
    DemoTransaction(date(2026, 5, 24), TransactionType.expense, Decimal("650.00"), "Yemek", "Öğle yemeği"),
    DemoTransaction(date(2026, 5, 26), TransactionType.expense, Decimal("680.00"), "Alışveriş", "Ev ihtiyaçları"),
    DemoTransaction(date(2026, 5, 28), TransactionType.expense, Decimal("310.00"), "Ulaşım", "Toplu taşıma yükleme"),
    DemoTransaction(date(2026, 5, 30), TransactionType.expense, Decimal("261.00"), "Abonelikler", "Bulut depolama aboneliği"),
)


def get_or_create_category(db: Session, user_id: int, name: str, expected_type: TransactionType) -> Category:
    category = db.scalar(select(Category).where(Category.user_id == user_id, Category.name == name))
    if category:
        if category.type != expected_type.value:
            raise RuntimeError(f"Kategori tipi uyumsuz: {name} mevcut={category.type}, beklenen={expected_type.value}")
        return category

    category_type, color = DEMO_CATEGORY_DEFINITIONS[name]
    category = Category(user_id=user_id, name=name, type=category_type.value, color=color)
    db.add(category)
    db.flush()
    return category


def find_existing_transaction(db: Session, user_id: int, item: DemoTransaction, category_id: int) -> Transaction | None:
    statement = select(Transaction.id).where(
        Transaction.user_id == user_id,
        Transaction.type == item.type,
        Transaction.occurred_on == item.occurred_on,
        Transaction.description == item.description,
        Transaction.category_id == category_id,
    )
    transaction_id = db.scalar(statement)
    if transaction_id is None:
        return None

    return db.get(Transaction, transaction_id)


def seed_demo_transactions(db: Session) -> SeedResult:
    user = ensure_single_user(db)
    result = SeedResult()

    categories = {
        item.category_name: get_or_create_category(db, user.id, item.category_name, item.type)
        for item in DEMO_TRANSACTIONS
    }

    for item in DEMO_TRANSACTIONS:
        category = categories[item.category_name]
        existing_transaction = find_existing_transaction(db, user.id, item, category.id)
        if existing_transaction:
            if Decimal(str(existing_transaction.amount)) != item.amount:
                existing_transaction.amount = item.amount
                result.updated += 1
            else:
                result.skipped += 1
            continue

        db.add(
            Transaction(
                user_id=user.id,
                category_id=category.id,
                type=item.type,
                amount=item.amount,
                description=item.description,
                occurred_on=item.occurred_on,
            )
        )
        result.inserted += 1

    db.commit()
    return result


def monthly_totals(month: int) -> tuple[Decimal, Decimal, Decimal, int]:
    items = [item for item in DEMO_TRANSACTIONS if item.occurred_on.month == month]
    income = sum((item.amount for item in items if item.type == TransactionType.income), Decimal("0.00"))
    expense = sum((item.amount for item in items if item.type == TransactionType.expense), Decimal("0.00"))
    return income, expense, income - expense, len(items)


def main() -> None:
    try:
        with SessionLocal() as db:
            result = seed_demo_transactions(db)
    except SQLAlchemyError as exc:
        raise SystemExit(f"Veritabani hatasi: {exc}") from exc
    except RuntimeError as exc:
        raise SystemExit(str(exc)) from exc

    april_income, april_expense, april_net, april_count = monthly_totals(4)
    may_income, may_expense, may_net, may_count = monthly_totals(5)
    used_categories = ", ".join(sorted({item.category_name for item in DEMO_TRANSACTIONS}))

    print("Credentia demo verisi tamamlandi.")
    print(f"Eklenen transaction: {result.inserted}")
    print(f"Guncellenen transaction: {result.updated}")
    print(f"Atlanan duplicate transaction: {result.skipped}")
    print(f"Nisan 2026: gelir {april_income} TL, gider {april_expense} TL, net {april_net} TL, islem {april_count}")
    print(f"Mayis 2026: gelir {may_income} TL, gider {may_expense} TL, net {may_net} TL, islem {may_count}")
    print(f"Kullanilan kategoriler: {used_categories}")


if __name__ == "__main__":
    main()
