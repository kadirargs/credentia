from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.reports.export_service import build_excel, build_pdf, file_period, normalize_currency
from app.modules.reports.service import build_report_data, report_to_dict
from app.services.single_user import ensure_single_user

router = APIRouter()


@router.get("/simple")
def simple_report(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    user = ensure_single_user(db)
    return report_to_dict(build_report_data(db, user.id, year, month))


@router.get("/export/pdf")
def export_pdf(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    currency: str = Query("TRY"),
    db: Session = Depends(get_db),
) -> Response:
    user = ensure_single_user(db)
    report = build_report_data(db, user.id, year, month)
    normalized_currency = normalize_currency(currency)
    filename = f"credentia-rapor-{file_period(report)}.pdf"

    return Response(
        content=build_pdf(report, normalized_currency),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/excel")
def export_excel(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    currency: str = Query("TRY"),
    db: Session = Depends(get_db),
) -> Response:
    user = ensure_single_user(db)
    report = build_report_data(db, user.id, year, month)
    normalized_currency = normalize_currency(currency)
    filename = f"credentia-rapor-{file_period(report)}.xlsx"

    return Response(
        content=build_excel(report, normalized_currency),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
