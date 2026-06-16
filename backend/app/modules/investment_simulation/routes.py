from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.modules.investment_simulation.service import CryptoPriceError, build_simulation
from app.schemas.investment_simulation import InvestmentSimulationResponse

router = APIRouter()


@router.get("", response_model=InvestmentSimulationResponse)
def investment_simulation(
    risk: Literal["low", "medium", "high"] = Query("medium"),
    period: Literal["short", "medium", "long"] = Query("medium"),
    amount: float = Query(10000, gt=0, le=100000000),
) -> InvestmentSimulationResponse:
    try:
        return build_simulation(risk=risk, period=period, amount=amount)
    except CryptoPriceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
