from pydantic import BaseModel


class PortfolioItem(BaseModel):
    symbol: str
    name: str
    weight: float
    startPrice: float
    currentPrice: float
    startValue: float
    currentValue: float
    profitLossPercent: float


class ChartPoint(BaseModel):
    label: str
    value: float


class InvestmentSimulationResponse(BaseModel):
    amount: float
    risk: str
    period: str
    initialDateLabel: str
    currentValue: float
    profitLoss: float
    profitLossPercent: float
    portfolio: list[PortfolioItem]
    chartData: list[ChartPoint]
    disclaimer: str
