from __future__ import annotations

import json
import math
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import settings
from app.schemas.investment_simulation import ChartPoint, InvestmentSimulationResponse, PortfolioItem

DISCLAIMER = (
    "Bu simülasyon geçmiş fiyat verilerine dayanır. Yatırım tavsiyesi değildir. "
    "Canlı fiyat API'lerine erişilemezse yaklaşık referans veriler kullanılabilir."
)
BINANCE_API_URLS = [
    "https://api.binance.com/api/v3",
    "https://api1.binance.com/api/v3",
    "https://api2.binance.com/api/v3",
    "https://data-api.binance.vision/api/v3",
]
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
DAY_MS = 24 * 60 * 60 * 1000
ESTIMATED_USDT_TRY = 40.0

ESTIMATED_CURRENT_TRY = {
    "BTC": 4300000.0,
    "ETH": 150000.0,
    "BNB": 28000.0,
    "SOL": 6800.0,
    "XRP": 100.0,
    "ADA": 30.0,
    "DOGE": 7.5,
    "AVAX": 1500.0,
    "LINK": 750.0,
    "TRX": 6.0,
}

ESTIMATED_PERIOD_MULTIPLIERS = {
    7: {
        "BTC": 1.02,
        "ETH": 1.01,
        "BNB": 1.005,
        "SOL": 1.04,
        "XRP": 0.99,
        "ADA": 1.015,
        "DOGE": 1.03,
        "AVAX": 1.035,
        "LINK": 1.022,
        "TRX": 1.007,
    },
    30: {
        "BTC": 1.08,
        "ETH": 1.06,
        "BNB": 1.03,
        "SOL": 1.16,
        "XRP": 1.04,
        "ADA": 1.07,
        "DOGE": 1.12,
        "AVAX": 1.14,
        "LINK": 1.09,
        "TRX": 1.025,
    },
    90: {
        "BTC": 1.18,
        "ETH": 1.14,
        "BNB": 1.09,
        "SOL": 1.32,
        "XRP": 1.11,
        "ADA": 1.16,
        "DOGE": 1.24,
        "AVAX": 1.28,
        "LINK": 1.2,
        "TRX": 1.07,
    },
}


@dataclass(frozen=True)
class CoinConfig:
    symbol: str
    name: str
    binance_symbol: str
    coingecko_id: str


COINS = {
    "BTC": CoinConfig("BTC", "Bitcoin", "BTCUSDT", "bitcoin"),
    "ETH": CoinConfig("ETH", "Ethereum", "ETHUSDT", "ethereum"),
    "BNB": CoinConfig("BNB", "BNB", "BNBUSDT", "binancecoin"),
    "SOL": CoinConfig("SOL", "Solana", "SOLUSDT", "solana"),
    "XRP": CoinConfig("XRP", "XRP", "XRPUSDT", "ripple"),
    "ADA": CoinConfig("ADA", "Cardano", "ADAUSDT", "cardano"),
    "DOGE": CoinConfig("DOGE", "Dogecoin", "DOGEUSDT", "dogecoin"),
    "AVAX": CoinConfig("AVAX", "Avalanche", "AVAXUSDT", "avalanche-2"),
    "LINK": CoinConfig("LINK", "Chainlink", "LINKUSDT", "chainlink"),
    "TRX": CoinConfig("TRX", "TRON", "TRXUSDT", "tron"),
}

PORTFOLIOS = {
    "low": ["BTC", "ETH", "BNB", "TRX"],
    "medium": ["BTC", "ETH", "SOL", "XRP", "LINK"],
    "high": ["SOL", "AVAX", "DOGE", "ADA", "XRP"],
}

PERIODS = {
    "short": {"days": 7, "label": "7 gün önce"},
    "medium": {"days": 30, "label": "30 gün önce"},
    "long": {"days": 90, "label": "90 gün önce"},
}


class CryptoPriceError(RuntimeError):
    pass


def round_money(value: float) -> float:
    return round(value, 2)


def round_percent(value: float) -> float:
    return round(value, 2)


def safe_float(value: object) -> float | None:
    if value is None:
        return None

    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(parsed):
        return None

    return parsed


def coin_by_binance_symbol(symbol: str) -> CoinConfig | None:
    for coin in COINS.values():
        if coin.binance_symbol == symbol:
            return coin
    return None


def fetch_url_json(url: str, extra_headers: dict[str, str] | None = None) -> object:
    headers = {
        "Accept": "application/json",
        "User-Agent": "Credentia/0.1 investment-simulation",
    }
    if extra_headers:
        headers.update(extra_headers)

    request = Request(
        url,
        headers=headers,
    )
    with urlopen(request, timeout=12) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def fetch_json(path: str, params: dict[str, object]) -> object:
    query = urlencode(params)
    last_error: Exception | None = None

    for api_url in BINANCE_API_URLS:
        try:
            return fetch_url_json(f"{api_url}{path}?{query}")
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            last_error = exc

    raise CryptoPriceError("Kripto fiyat verisi alınamadı.") from last_error


def coingecko_headers() -> dict[str, str]:
    if not settings.coingecko_api_key:
        return {}

    return {"x-cg-demo-api-key": settings.coingecko_api_key}


def fetch_coingecko_current_usd(coin: CoinConfig) -> float:
    query = urlencode({"ids": coin.coingecko_id, "vs_currencies": "usd"})
    payload = fetch_url_json(f"{COINGECKO_API_URL}/simple/price?{query}", coingecko_headers())
    if not isinstance(payload, dict):
        raise CryptoPriceError("CoinGecko güncel fiyat verisi okunamadı.")

    price = safe_float(payload.get(coin.coingecko_id, {}).get("usd"))
    if price is None or price <= 0:
        raise CryptoPriceError("CoinGecko güncel fiyat verisi eksik.")

    return price


def fetch_coingecko_historical_usd(coin: CoinConfig, days_ago: int) -> float:
    target_date = datetime.now(tz=timezone.utc) - timedelta(days=days_ago)
    date_label = target_date.strftime("%d-%m-%Y")
    query = urlencode({"date": date_label, "localization": "false"})
    payload = fetch_url_json(f"{COINGECKO_API_URL}/coins/{coin.coingecko_id}/history?{query}", coingecko_headers())
    if not isinstance(payload, dict):
        raise CryptoPriceError("CoinGecko geçmiş fiyat verisi okunamadı.")

    price = safe_float(payload.get("market_data", {}).get("current_price", {}).get("usd"))
    if price is None or price <= 0:
        raise CryptoPriceError("CoinGecko geçmiş fiyat verisi eksik.")

    return price


def estimated_current_usd(coin: CoinConfig) -> float:
    current_try = ESTIMATED_CURRENT_TRY.get(coin.symbol)
    if current_try is None:
        raise CryptoPriceError("Tahmini fiyat verisi eksik.")
    return current_try / ESTIMATED_USDT_TRY


def estimated_historical_usd(coin: CoinConfig, days_ago: int) -> float:
    current_try = ESTIMATED_CURRENT_TRY.get(coin.symbol)
    multipliers = ESTIMATED_PERIOD_MULTIPLIERS.get(days_ago)
    multiplier = multipliers.get(coin.symbol) if multipliers else None
    if current_try is None or multiplier is None or multiplier <= 0:
        raise CryptoPriceError("Tahmini geçmiş fiyat verisi eksik.")
    return (current_try / ESTIMATED_USDT_TRY) / multiplier


def fetch_current_price(symbol: str) -> float:
    try:
        payload = fetch_json("/ticker/price", {"symbol": symbol})
        if not isinstance(payload, dict):
            raise CryptoPriceError("Güncel fiyat verisi okunamadı.")

        price = safe_float(payload.get("price"))
        if price is None or price <= 0:
            raise CryptoPriceError("Güncel fiyat verisi eksik.")

        return price
    except CryptoPriceError:
        if symbol == "USDTTRY":
            return ESTIMATED_USDT_TRY

        coin = coin_by_binance_symbol(symbol)
        if coin is None:
            raise

        try:
            return fetch_coingecko_current_usd(coin)
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError, CryptoPriceError):
            return estimated_current_usd(coin)


def fetch_historical_close(symbol: str, days_ago: int) -> float:
    target_ms = int(time.time() * 1000) - (days_ago * DAY_MS)
    try:
        payload = fetch_json(
            "/klines",
            {
                "symbol": symbol,
                "interval": "1d",
                "startTime": target_ms,
                "limit": 1,
            },
        )
        if not isinstance(payload, list) or not payload:
            raise CryptoPriceError("Geçmiş fiyat verisi eksik.")

        close_price = safe_float(payload[0][4] if isinstance(payload[0], list) and len(payload[0]) > 4 else None)
        if close_price is None or close_price <= 0:
            raise CryptoPriceError("Geçmiş fiyat verisi okunamadı.")

        return close_price
    except CryptoPriceError:
        if symbol == "USDTTRY":
            return ESTIMATED_USDT_TRY

        coin = coin_by_binance_symbol(symbol)
        if coin is None:
            raise

        try:
            return fetch_coingecko_historical_usd(coin, days_ago)
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError, CryptoPriceError):
            return estimated_historical_usd(coin, days_ago)


def build_simulation(risk: str, period: str, amount: float) -> InvestmentSimulationResponse:
    symbols = PORTFOLIOS[risk]
    period_config = PERIODS[period]
    days_ago = int(period_config["days"])
    coin_configs = [COINS[symbol] for symbol in symbols]
    start_value_per_coin = amount / len(coin_configs)
    weight = 100 / len(coin_configs)

    try_price = fetch_current_price("USDTTRY")
    historical_try_price = fetch_historical_close("USDTTRY", days_ago)

    portfolio: list[PortfolioItem] = []
    for coin in coin_configs:
        current_usdt = fetch_current_price(coin.binance_symbol)
        start_usdt = fetch_historical_close(coin.binance_symbol, days_ago)

        current_price = current_usdt * try_price
        start_price = start_usdt * historical_try_price
        multiplier = current_price / start_price if start_price > 0 else 0
        if multiplier <= 0 or not math.isfinite(multiplier):
            continue

        current_value = start_value_per_coin * multiplier
        change_percent = (multiplier - 1) * 100

        portfolio.append(
            PortfolioItem(
                symbol=coin.symbol,
                name=coin.name,
                weight=round_percent(weight),
                startPrice=round_money(start_price),
                currentPrice=round_money(current_price),
                startValue=round_money(start_value_per_coin),
                currentValue=round_money(current_value),
                profitLossPercent=round_percent(change_percent),
            )
        )

    if not portfolio:
        raise CryptoPriceError("Simülasyon için yeterli fiyat verisi alınamadı.")

    current_value = sum(item.currentValue for item in portfolio)
    profit_loss = current_value - amount
    profit_loss_percent = (profit_loss / amount) * 100 if amount > 0 else 0

    return InvestmentSimulationResponse(
        amount=round_money(amount),
        risk=risk,
        period=period,
        initialDateLabel=str(period_config["label"]),
        currentValue=round_money(current_value),
        profitLoss=round_money(profit_loss),
        profitLossPercent=round_percent(profit_loss_percent),
        portfolio=portfolio,
        chartData=[
            ChartPoint(label="Başlangıç", value=round_money(amount)),
            ChartPoint(label="Bugün", value=round_money(current_value)),
        ],
        disclaimer=DISCLAIMER,
    )
