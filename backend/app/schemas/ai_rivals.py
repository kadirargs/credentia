from pydantic import BaseModel


class AiRivalPortfolioItem(BaseModel):
    symbol: str
    name: str
    weight: float
    startPrice: float
    currentPrice: float
    startValue: float
    currentValue: float
    profitLossPercent: float


class AiRivalPerformancePoint(BaseModel):
    label: str
    value: float


class AiRivalResult(BaseModel):
    id: str
    name: str
    type: str
    description: str
    riskLevel: str
    currentValue: float
    profitLoss: float
    profitLossPercent: float
    maxDrawdownPercent: float
    rank: int
    portfolioSummary: str
    portfolio: list[AiRivalPortfolioItem]
    performancePoints: list[AiRivalPerformancePoint]


class AiRivalWinner(BaseModel):
    id: str
    name: str
    riskLevel: str
    currentValue: float
    profitLossPercent: float


class AiRivalsSimulationResponse(BaseModel):
    amount: float
    risk: str
    period: str
    initialDateLabel: str
    results: list[AiRivalResult]
    winner: AiRivalWinner
    userRank: int
    reasonText: str
    lessonText: str
    disclaimer: str
