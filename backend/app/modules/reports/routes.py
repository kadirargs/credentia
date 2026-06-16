from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import TransactionType
from app.modules.analytics.routes import category_breakdown, monthly_summary

router = APIRouter()


@router.get("/simple")
def simple_report(db: Session = Depends(get_db)) -> dict[str, object]:
    return {
        "summary": monthly_summary(db),
        "category_breakdown": category_breakdown(type=TransactionType.expense, db=db),
    }
