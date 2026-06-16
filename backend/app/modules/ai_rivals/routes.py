from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.modules.ai_rivals.service import build_ai_rivals_simulation
from app.modules.investment_simulation.service import CryptoPriceError
from app.schemas.ai_rivals import AiRivalsSimulationResponse

router = APIRouter()


@router.get("/simulation", response_model=AiRivalsSimulationResponse)
def ai_rivals_simulation(
    amount: float = Query(10000, gt=0, le=100000000),
    risk: Literal["low", "medium", "high"] = Query("medium"),
    period: Literal["short", "medium", "long"] = Query("medium"),
) -> AiRivalsSimulationResponse:
    try:
        return build_ai_rivals_simulation(risk=risk, period=period, amount=amount)
    except CryptoPriceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
