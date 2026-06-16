from pydantic import BaseModel


class CrisisMonthlyPoint(BaseModel):
    month: str
    price: float
    estimatedValue: float


class CrisisScenarioSimulationResponse(BaseModel):
    scenario: str
    scenarioName: str
    coin: str
    amount: float
    startDate: str
    endDate: str
    startPrice: float | None
    endPrice: float | None
    finalValue: float | None
    profitLoss: float | None
    profitLossPercent: float | None
    monthlyPrices: list[CrisisMonthlyPoint]
    hasEnoughData: bool
    isEstimated: bool
    message: str | None
    disclaimer: str
