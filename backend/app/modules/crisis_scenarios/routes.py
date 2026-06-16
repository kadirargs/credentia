from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.modules.crisis_scenarios.service import build_crisis_simulation
from app.modules.investment_simulation.service import CryptoPriceError
from app.schemas.crisis_scenarios import CrisisScenarioSimulationResponse

router = APIRouter()


@router.get("/simulation", response_model=CrisisScenarioSimulationResponse)
def crisis_scenario_simulation(
    scenario: Literal["pandemic_2020", "crypto_2022"] = Query("crypto_2022"),
    coin: Literal["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "LINK", "TRX"] = Query("BTC"),
    amount: float = Query(10000, gt=0, le=100000000),
) -> CrisisScenarioSimulationResponse:
    try:
        return build_crisis_simulation(scenario_id=scenario, coin_symbol=coin, amount=amount)
    except CryptoPriceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
