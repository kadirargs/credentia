from __future__ import annotations

import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

from app.modules.investment_simulation.service import (
    COINS,
    DISCLAIMER,
    PERIODS,
    PORTFOLIOS,
    CryptoPriceError,
    fetch_current_price,
    fetch_historical_close,
    round_money,
    round_percent,
)
from app.schemas.ai_rivals import (
    AiRivalPerformancePoint,
    AiRivalPortfolioItem,
    AiRivalResult,
    AiRivalWinner,
    AiRivalsSimulationResponse,
)


@dataclass(frozen=True)
class StrategyProfile:
    id: str
    name: str
    type: str
    description: str
    risk_level: str
    weights: dict[str, float]


COMPARISON_STRATEGIES = [
    StrategyProfile(
        id="defensive_strategy",
        name="Koruyucu Strateji",
        type="strategy",
        description="Büyük piyasa değerli coinlere ağırlık veren düşük riskli profil.",
        risk_level="Düşük Risk",
        weights={"BTC": 50, "ETH": 30, "BNB": 20},
    ),
    StrategyProfile(
        id="balanced_strategy",
        name="Dengeli Strateji",
        type="strategy",
        description="Büyük ve orta riskli coinleri birlikte kullanan dengeli profil.",
        risk_level="Orta Risk",
        weights={"BTC": 30, "ETH": 25, "SOL": 15, "XRP": 15, "LINK": 15},
    ),
    StrategyProfile(
        id="aggressive_strategy",
        name="Agresif Strateji",
        type="strategy",
        description="Daha volatil coinlere ağırlık veren yüksek riskli profil.",
        risk_level="Yüksek Risk",
        weights={"SOL": 25, "AVAX": 25, "DOGE": 20, "ADA": 15, "XRP": 15},
    ),
]


@dataclass(frozen=True)
class PriceSnapshot:
    start_price: float
    current_price: float


def user_strategy_for_risk(risk: str) -> StrategyProfile:
    symbols = PORTFOLIOS[risk]
    weight = 100 / len(symbols)
    risk_labels = {
        "low": "Düşük Risk",
        "medium": "Orta Risk",
        "high": "Yüksek Risk",
    }
    return StrategyProfile(
        id="user",
        name="Senin Stratejin",
        type="user",
        description="Seçtiğiniz risk ve vade tercihine göre oluşturulan portföy.",
        risk_level=risk_labels.get(risk, "Orta Risk"),
        weights={symbol: weight for symbol in symbols},
    )


def normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    total = sum(weights.values())
    if total <= 0:
        raise CryptoPriceError("Strateji ağırlıkları geçersiz.")

    return {symbol: (weight / total) * 100 for symbol, weight in weights.items()}


def fetch_price_snapshots(symbols: set[str], days_ago: int) -> dict[str, PriceSnapshot]:
    try_price = fetch_current_price("USDTTRY")
    historical_try_price = fetch_historical_close("USDTTRY", days_ago)
    snapshots: dict[str, PriceSnapshot] = {}

    def load_symbol(symbol: str) -> tuple[str, PriceSnapshot]:
        coin = COINS[symbol]
        current_usdt = fetch_current_price(coin.binance_symbol)
        start_usdt = fetch_historical_close(coin.binance_symbol, days_ago)
        return symbol, PriceSnapshot(
            start_price=start_usdt * historical_try_price,
            current_price=current_usdt * try_price,
        )

    with ThreadPoolExecutor(max_workers=min(8, max(1, len(symbols)))) as executor:
        futures = [executor.submit(load_symbol, symbol) for symbol in sorted(symbols)]
        for future in as_completed(futures):
            symbol, snapshot = future.result()
            snapshots[symbol] = snapshot

    return snapshots


def risk_drawdown_base(risk_level: str, days_ago: int) -> float:
    base = {
        "Düşük Risk": 5.0,
        "Orta Risk": 8.0,
        "Yüksek Risk": 13.0,
    }.get(risk_level, 8.0)
    period_factor = 0.55 if days_ago <= 7 else 0.8 if days_ago <= 30 else 1.0
    return base * period_factor


def calculate_max_drawdown(points: list[AiRivalPerformancePoint]) -> float:
    peak = points[0].value if points else 0
    max_drawdown = 0.0
    for point in points:
        if point.value > peak:
            peak = point.value
        if peak > 0:
            drawdown = ((point.value - peak) / peak) * 100
            max_drawdown = min(max_drawdown, drawdown)
    return round_percent(max_drawdown)


def build_performance_points(amount: float, current_value: float, profit_loss_percent: float, risk_level: str, days_ago: int) -> list[AiRivalPerformancePoint]:
    drawdown_pressure = risk_drawdown_base(risk_level, days_ago)
    trend_component = profit_loss_percent * 0.45
    middle_value = amount * (1 + (trend_component - (drawdown_pressure * 0.35)) / 100)
    middle_value = max(amount * 0.15, middle_value)

    return [
        AiRivalPerformancePoint(label="Başlangıç", value=round_money(amount)),
        AiRivalPerformancePoint(label="Orta dönem", value=round_money(middle_value)),
        AiRivalPerformancePoint(label="Bugün", value=round_money(current_value)),
    ]


def build_strategy_result(
    strategy: StrategyProfile,
    amount: float,
    snapshots: dict[str, PriceSnapshot],
    days_ago: int,
) -> AiRivalResult:
    normalized_weights = normalize_weights(strategy.weights)
    portfolio: list[AiRivalPortfolioItem] = []

    for symbol, weight in normalized_weights.items():
        coin = COINS[symbol]
        snapshot = snapshots.get(symbol)
        if snapshot is None or snapshot.start_price <= 0 or snapshot.current_price <= 0:
            continue

        multiplier = snapshot.current_price / snapshot.start_price
        if multiplier <= 0 or not math.isfinite(multiplier):
            continue

        start_value = amount * (weight / 100)
        current_value = start_value * multiplier
        portfolio.append(
            AiRivalPortfolioItem(
                symbol=symbol,
                name=coin.name,
                weight=round_percent(weight),
                startPrice=round_money(snapshot.start_price),
                currentPrice=round_money(snapshot.current_price),
                startValue=round_money(start_value),
                currentValue=round_money(current_value),
                profitLossPercent=round_percent((multiplier - 1) * 100),
            )
        )

    if not portfolio:
        raise CryptoPriceError("Strateji için yeterli fiyat verisi alınamadı.")

    current_value = sum(item.currentValue for item in portfolio)
    profit_loss = current_value - amount
    profit_loss_percent = (profit_loss / amount) * 100 if amount > 0 else 0
    performance_points = build_performance_points(
        amount=amount,
        current_value=current_value,
        profit_loss_percent=profit_loss_percent,
        risk_level=strategy.risk_level,
        days_ago=days_ago,
    )

    return AiRivalResult(
        id=strategy.id,
        name=strategy.name,
        type=strategy.type,
        description=strategy.description,
        riskLevel=strategy.risk_level,
        currentValue=round_money(current_value),
        profitLoss=round_money(profit_loss),
        profitLossPercent=round_percent(profit_loss_percent),
        maxDrawdownPercent=calculate_max_drawdown(performance_points),
        rank=0,
        portfolioSummary=" · ".join(f"{item.symbol} %{item.weight:g}" for item in portfolio),
        portfolio=portfolio,
        performancePoints=performance_points,
    )


def rank_results(results: list[AiRivalResult]) -> list[AiRivalResult]:
    ranked = sorted(results, key=lambda item: item.currentValue, reverse=True)
    ranks = {item.id: index + 1 for index, item in enumerate(ranked)}

    return [
        item.model_copy(update={"rank": ranks[item.id]})
        for item in results
    ]


def build_reason_text(winner: AiRivalResult) -> str:
    if winner.id == "user":
        return "Bu dönemde senin seçtiğin risk profiline uygun portföy, diğer stratejilere göre daha yüksek tahmini değer üretmiş görünüyor."
    if winner.id == "defensive_strategy":
        return "Bu dönemde koruyucu strateji daha iyi sonuç verdi. BTC, ETH ve BNB gibi büyük piyasa değerli varlıklar, daha volatil varlıklara göre daha sınırlı dalgalanmış olabilir."
    if winner.id == "aggressive_strategy":
        return "Bu dönemde agresif strateji öne çıktı. SOL, AVAX ve DOGE gibi daha volatil varlıklar seçilen dönemde daha yüksek performans göstermiş olabilir."
    return "Bu dönemde dengeli strateji öne çıktı. Büyük ve orta riskli varlıklar arasındaki dağılım risk-getiri dengesini desteklemiş olabilir."


def build_lesson_text(winner: AiRivalResult) -> str:
    if winner.id == "user":
        return "Seçtiğin risk profili bu dönemde diğer stratejilere göre daha yüksek tahmini sonuç üretmiş görünüyor. Bu yalnızca geçmiş veriye dayalı bir simülasyondur; geçmiş performans gelecekte aynı sonucu garanti etmez."
    if winner.riskLevel == "Düşük Risk":
        return "Düşük riskli stratejiler zayıf piyasa dönemlerinde daha sınırlı kayıp gösterebilir. Geçmiş performans gelecekte aynı sonucun oluşacağını garanti etmez."
    if winner.riskLevel == "Yüksek Risk":
        return "Agresif stratejiler yükseliş dönemlerinde daha yüksek sonuç üretebilir. Ancak düşüş dönemlerinde kayıplar daha sert olabilir."
    return "Dengeli stratejiler bazı dönemlerde risk ve getiri arasında daha orta bir sonuç üretebilir. Geçmiş performans gelecekte aynı sonucun oluşacağını garanti etmez."


def build_ai_rivals_simulation(risk: str, period: str, amount: float) -> AiRivalsSimulationResponse:
    period_config = PERIODS[period]
    days_ago = int(period_config["days"])
    strategies = [user_strategy_for_risk(risk), *COMPARISON_STRATEGIES]
    symbols = {symbol for strategy in strategies for symbol in strategy.weights}
    snapshots = fetch_price_snapshots(symbols, days_ago)
    results = rank_results([build_strategy_result(strategy, amount, snapshots, days_ago) for strategy in strategies])
    winner_result = max(results, key=lambda item: item.currentValue)
    user_result = next(item for item in results if item.id == "user")

    return AiRivalsSimulationResponse(
        amount=round_money(amount),
        risk=risk,
        period=period,
        initialDateLabel=str(period_config["label"]),
        results=results,
        winner=AiRivalWinner(
            id=winner_result.id,
            name=winner_result.name,
            riskLevel=winner_result.riskLevel,
            currentValue=winner_result.currentValue,
            profitLossPercent=winner_result.profitLossPercent,
        ),
        userRank=user_result.rank,
        reasonText=build_reason_text(winner_result),
        lessonText=build_lesson_text(winner_result),
        disclaimer=DISCLAIMER,
    )
