from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone

from app.modules.investment_simulation.service import (
    COINS,
    DISCLAIMER,
    ESTIMATED_CURRENT_TRY,
    CryptoPriceError,
    fetch_json,
    round_money,
    round_percent,
    safe_float,
)
from app.schemas.crisis_scenarios import CrisisMonthlyPoint, CrisisScenarioSimulationResponse


@dataclass(frozen=True)
class CrisisScenario:
    id: str
    name: str
    start_date: date
    end_date: date


SCENARIOS = {
    "pandemic_2020": CrisisScenario(
        id="pandemic_2020",
        name="2020 Pandemi Dönemi",
        start_date=date(2020, 1, 1),
        end_date=date(2020, 12, 31),
    ),
    "crypto_2022": CrisisScenario(
        id="crypto_2022",
        name="2022 Kripto Piyasası Çöküşü",
        start_date=date(2022, 1, 1),
        end_date=date(2022, 12, 31),
    ),
}

MONTH_NAMES = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
]

NO_DATA_MESSAGE = "Seçilen varlık için bu kriz döneminde yeterli fiyat verisi bulunamadı."
ESTIMATED_DATA_MESSAGE = "Canlı aylık fiyat verisi alınamadığı için yaklaşık referans seri kullanıldı."

ESTIMATED_SCENARIO_PATHS = {
    "pandemic_2020": [1.0, 0.86, 0.68, 0.92, 1.04, 1.15, 1.24, 1.38, 1.48, 1.62, 1.9, 2.18],
    "crypto_2022": [1.0, 0.8, 0.72, 0.66, 0.56, 0.4, 0.44, 0.46, 0.42, 0.36, 0.31, 0.34],
}

ESTIMATED_VOLATILITY = {
    "BTC": 0.9,
    "ETH": 1.0,
    "BNB": 0.95,
    "SOL": 1.28,
    "XRP": 1.08,
    "ADA": 1.18,
    "DOGE": 1.35,
    "AVAX": 1.3,
    "LINK": 1.16,
    "TRX": 0.82,
}


def date_to_ms(value: date) -> int:
    return int(datetime(value.year, value.month, value.day, tzinfo=timezone.utc).timestamp() * 1000)


def month_label(open_time_ms: int) -> str:
    opened = datetime.fromtimestamp(open_time_ms / 1000, tz=timezone.utc)
    return f"{MONTH_NAMES[opened.month - 1]} {opened.year}"


def scenario_month_labels(scenario: CrisisScenario) -> list[str]:
    return [f"{MONTH_NAMES[month - 1]} {scenario.start_date.year}" for month in range(1, 13)]


def apply_coin_volatility(base_multiplier: float, coin_symbol: str) -> float:
    volatility = ESTIMATED_VOLATILITY.get(coin_symbol, 1.0)
    if base_multiplier >= 1:
        return 1 + ((base_multiplier - 1) * volatility)

    return max(0.08, 1 - ((1 - base_multiplier) * volatility))


def build_estimated_monthly_prices(scenario: CrisisScenario, coin_symbol: str) -> list[CrisisMonthlyPoint]:
    base_path = ESTIMATED_SCENARIO_PATHS.get(scenario.id, [])
    current_try = ESTIMATED_CURRENT_TRY.get(coin_symbol)

    if not base_path or current_try is None or current_try <= 0:
        return []

    adjusted_path = [apply_coin_volatility(multiplier, coin_symbol) for multiplier in base_path]
    end_multiplier = adjusted_path[-1]
    if end_multiplier <= 0:
        return []

    start_price = current_try / end_multiplier
    return [
        CrisisMonthlyPoint(
            month=label,
            price=round_money(start_price * multiplier),
            estimatedValue=0,
        )
        for label, multiplier in zip(scenario_month_labels(scenario), adjusted_path)
    ]


def fetch_monthly_closes(symbol: str, scenario: CrisisScenario) -> dict[str, tuple[int, float]]:
    payload = fetch_json(
        "/klines",
        {
            "symbol": symbol,
            "interval": "1M",
            "startTime": date_to_ms(scenario.start_date),
            "endTime": date_to_ms(scenario.end_date),
            "limit": 12,
        },
    )
    if not isinstance(payload, list):
        raise CryptoPriceError("Aylık fiyat verisi okunamadı.")

    rows: dict[str, tuple[int, float]] = {}
    for row in payload:
        if not isinstance(row, list) or len(row) <= 4:
            continue

        open_time = safe_float(row[0])
        close_price = safe_float(row[4])
        if open_time is None or close_price is None or close_price <= 0:
            continue

        rows[month_label(int(open_time))] = (int(open_time), close_price)

    return rows


def empty_response(scenario: CrisisScenario, coin: str, amount: float) -> CrisisScenarioSimulationResponse:
    return CrisisScenarioSimulationResponse(
        scenario=scenario.id,
        scenarioName=scenario.name,
        coin=coin,
        amount=round_money(amount),
        startDate=scenario.start_date.isoformat(),
        endDate=scenario.end_date.isoformat(),
        startPrice=None,
        endPrice=None,
        finalValue=None,
        profitLoss=None,
        profitLossPercent=None,
        monthlyPrices=[],
        hasEnoughData=False,
        isEstimated=False,
        message=NO_DATA_MESSAGE,
        disclaimer=DISCLAIMER,
    )


def apply_amount_to_points(
    scenario: CrisisScenario,
    coin_symbol: str,
    amount: float,
    monthly_prices: list[CrisisMonthlyPoint],
    is_estimated: bool,
    message: str | None,
) -> CrisisScenarioSimulationResponse:
    if len(monthly_prices) < 2:
        return empty_response(scenario, coin_symbol, amount)

    start_price = monthly_prices[0].price
    end_price = monthly_prices[-1].price
    if start_price <= 0:
        return empty_response(scenario, coin_symbol, amount)

    calculated_points = [
        CrisisMonthlyPoint(
            month=point.month,
            price=point.price,
            estimatedValue=round_money(amount * point.price / start_price),
        )
        for point in monthly_prices
    ]
    final_value = calculated_points[-1].estimatedValue
    profit_loss = final_value - amount
    profit_loss_percent = (profit_loss / amount) * 100 if amount > 0 else 0

    return CrisisScenarioSimulationResponse(
        scenario=scenario.id,
        scenarioName=scenario.name,
        coin=coin_symbol,
        amount=round_money(amount),
        startDate=scenario.start_date.isoformat(),
        endDate=scenario.end_date.isoformat(),
        startPrice=round_money(start_price),
        endPrice=round_money(end_price),
        finalValue=round_money(final_value),
        profitLoss=round_money(profit_loss),
        profitLossPercent=round_percent(profit_loss_percent),
        monthlyPrices=calculated_points,
        hasEnoughData=True,
        isEstimated=is_estimated,
        message=message,
        disclaimer=DISCLAIMER,
    )


def build_crisis_simulation(scenario_id: str, coin_symbol: str, amount: float) -> CrisisScenarioSimulationResponse:
    scenario = SCENARIOS[scenario_id]
    coin = COINS[coin_symbol]
    try:
        coin_prices = fetch_monthly_closes(coin.binance_symbol, scenario)
        try_prices = fetch_monthly_closes("USDTTRY", scenario)
    except CryptoPriceError:
        return apply_amount_to_points(
            scenario=scenario,
            coin_symbol=coin_symbol,
            amount=amount,
            monthly_prices=build_estimated_monthly_prices(scenario, coin_symbol),
            is_estimated=True,
            message=ESTIMATED_DATA_MESSAGE,
        )

    monthly_prices: list[CrisisMonthlyPoint] = []
    for label, (open_time, coin_close) in sorted(coin_prices.items(), key=lambda item: item[1][0]):
        try_row = try_prices.get(label)
        if try_row is None:
            continue

        price_try = coin_close * try_row[1]
        if price_try <= 0:
            continue

        monthly_prices.append(
            CrisisMonthlyPoint(
                month=label,
                price=round_money(price_try),
                estimatedValue=0,
            )
        )

    if len(monthly_prices) < 2:
        return apply_amount_to_points(
            scenario=scenario,
            coin_symbol=coin_symbol,
            amount=amount,
            monthly_prices=build_estimated_monthly_prices(scenario, coin_symbol),
            is_estimated=True,
            message=ESTIMATED_DATA_MESSAGE,
        )

    return apply_amount_to_points(
        scenario=scenario,
        coin_symbol=coin_symbol,
        amount=amount,
        monthly_prices=monthly_prices,
        is_estimated=False,
        message=None,
    )
