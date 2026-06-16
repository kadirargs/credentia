from __future__ import annotations

import json
from calendar import monthrange
from datetime import date
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.modules.analytics.service import build_category_summary, build_summary, month_range
from app.schemas.assistant import AssistantMessage

DISCLAIMER = "Finans ve yatırım konularındaki yanıtlar bilgilendirme amaçlıdır; finansal tavsiye değildir."
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GEMINI_FALLBACK_MODELS = ["gemini-flash-lite-latest", "gemini-2.0-flash-lite"]

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


class AssistantConfigurationError(RuntimeError):
    pass


class AssistantProviderError(RuntimeError):
    pass


def round_money(value: float) -> float:
    return round(float(value or 0), 2)


def period_label(year: int, month: int) -> str:
    return f"{MONTH_NAMES[month - 1]} {year}"


def calculate_budget_spent(db: Session, user_id: int, category_id: int, year: int, month: int) -> float:
    start_date, end_date = month_range(year, month)
    spent = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.type == TransactionType.expense,
            Transaction.occurred_on >= start_date,
            Transaction.occurred_on < end_date,
        )
    )
    return float(spent or 0)


def build_budget_summary(db: Session, user_id: int, year: int, month: int) -> dict[str, object]:
    budgets = list(
        db.scalars(
            select(Budget)
            .join(Category, Category.id == Budget.category_id)
            .where(Budget.user_id == user_id, Budget.year == year, Budget.month == month)
            .order_by(Category.name.asc())
        )
    )

    items: list[dict[str, object]] = []
    total_limit = 0.0
    total_spent = 0.0

    for budget in budgets:
        limit_amount = float(budget.limit_amount)
        spent_amount = calculate_budget_spent(db, user_id, budget.category_id, year, month)
        usage_percentage = round((spent_amount / limit_amount) * 100, 2) if limit_amount > 0 else 0.0
        total_limit += limit_amount
        total_spent += spent_amount
        items.append(
            {
                "categoryName": budget.category.name,
                "limitAmount": round_money(limit_amount),
                "spentAmount": round_money(spent_amount),
                "remainingAmount": round_money(limit_amount - spent_amount),
                "usagePercentage": usage_percentage,
                "isRisky": usage_percentage >= 80,
                "isOverLimit": usage_percentage > 100,
            }
        )

    return {
        "limitAmount": round_money(total_limit),
        "spentAmount": round_money(total_spent),
        "remainingAmount": round_money(total_limit - total_spent),
        "usagePercentage": round((total_spent / total_limit) * 100, 2) if total_limit > 0 else 0.0,
        "riskyBudgets": [item for item in items if item["isRisky"]],
        "budgets": items,
    }


def average_daily_expense(expense: float, year: int, month: int) -> float:
    today = date.today()
    if today.year == year and today.month == month:
        day_count = max(today.day, 1)
    else:
        day_count = monthrange(year, month)[1]
    return round_money(expense / day_count) if day_count > 0 else 0.0


def forecast_month_end_expense(expense: float, year: int, month: int) -> float | None:
    today = date.today()
    days_in_month = monthrange(year, month)[1]
    if today.year == year and today.month == month:
        return round_money((expense / max(today.day, 1)) * days_in_month)
    if date(year, month, 1) < date(today.year, today.month, 1):
        return round_money(expense)
    return None


def top_category_to_dict(item: object | None) -> dict[str, object] | None:
    if item is None:
        return None
    return {
        "categoryId": getattr(item, "categoryId", None),
        "categoryName": getattr(item, "categoryName", "Kategori yok"),
        "amount": round_money(getattr(item, "amount", 0)),
    }


def build_financial_context(db: Session, user_id: int, year: int, month: int) -> dict[str, object]:
    summary = build_summary(db, user_id, year, month)
    category_summary = build_category_summary(db, user_id, year, month)
    budgets = build_budget_summary(db, user_id, year, month)
    average_expense = average_daily_expense(summary.selectedMonthExpense, year, month)
    forecast_expense = forecast_month_end_expense(summary.selectedMonthExpense, year, month)

    return {
        "period": period_label(year, month),
        "currency": "TRY",
        "income": round_money(summary.selectedMonthIncome),
        "expense": round_money(summary.selectedMonthExpense),
        "netBalance": round_money(summary.selectedMonthNetBalance),
        "previousMonthIncome": round_money(summary.previousMonthIncome),
        "previousMonthExpense": round_money(summary.previousMonthExpense),
        "previousMonthNetBalance": round_money(summary.previousMonthNetBalance),
        "incomeChangePercent": summary.incomeChangePercent,
        "expenseChangePercent": summary.expenseChangePercent,
        "netBalanceChangePercent": summary.netBalanceChangePercent,
        "topExpenseCategory": top_category_to_dict(category_summary.topExpenseCategory),
        "topIncomeCategory": top_category_to_dict(category_summary.topIncomeCategory),
        "budgetSummary": budgets,
        "averageDailyExpense": average_expense,
        "monthEndForecastExpense": forecast_expense,
        "hasTransactions": summary.selectedMonthIncome > 0 or summary.selectedMonthExpense > 0,
    }


def message_needs_financial_context(message: str) -> bool:
    normalized = message.lower()
    keywords = [
        "bu ay",
        "gecen ay",
        "geçen ay",
        "dikkat ceken",
        "dikkat çeken",
        "gozune takilan",
        "gözüne takılan",
        "harcama",
        "gider",
        "gelir",
        "butce",
        "bütçe",
        "para",
        "finans",
        "bakiye",
        "kategori",
        "islem",
        "işlem",
        "rapor",
        "dashboard",
        "borc",
        "borç",
        "tasarruf",
        "birikim",
        "maas",
        "maaş",
        "fatura",
        "market",
        "kira",
        "kredi",
        "veriler",
        "verilerim",
        "credentia",
    ]
    return any(keyword in normalized for keyword in keywords)


def build_prompt(message: str, context: dict[str, object]) -> str:
    needs_financial_context = message_needs_financial_context(message)
    if not needs_financial_context:
        return (
            f"Kullanıcının mesajı: {message.strip()}\n\n"
            "Bu mesaj doğrudan kullanıcının finans verilerini istemiyor. "
            "Credentia verilerini araya sıkıştırma, rakam veya bütçe yorumu yapma; finans konusunu kullanıcı açmadıkça sen açma. "
            "Doğal, kısa ve samimi bir yardımcı gibi cevap ver. "
            "Cevabı kullanıcının o anki niyetine göre sürdür; gerekirse kısa bir soru sor."
        )

    return (
        f"Kullanıcının mesajı: {message.strip()}\n\n"
        "Aşağıdaki kayıtlı Credentia verileri senin arka plan notundur; kullanıcı özellikle istemedikçe bu verileri "
        "madde madde dökme veya rapor gibi sıralama. "
        "Finans verileriyle ilgili kişisel yorum yaparken sadece bu veriye dayan, ama cevabı doğal sohbet diliyle ver. "
        "Kullanıcı uygulama kullanımı, finans, planlama, üretkenlik, öğrenme veya günlük konularda soru sorarsa "
        "genel yardımcı asistan gibi yanıt ver. Finans verileriyle ilgili kişisel yorum yaparken sadece verilen veriye dayan. "
        "Verilmeyen kişisel veriyi uydurma. Kullanıcının mesajı kısa veya gündelikse sen de kısa ve gündelik cevap ver.\n\n"
        f"{json.dumps(context, ensure_ascii=False, indent=2)}"
    )


def history_to_contents(history: list[AssistantMessage], prompt: str) -> list[dict[str, object]]:
    contents: list[dict[str, object]] = []
    for item in history[-10:]:
        contents.append(
            {
                "role": "model" if item.role == "assistant" else "user",
                "parts": [{"text": item.content}],
            }
        )

    contents.append(
        {
            "role": "user",
            "parts": [{"text": prompt}],
        }
    )
    return contents


def gemini_payload(prompt: str, history: list[AssistantMessage]) -> dict[str, object]:
    return {
        "systemInstruction": {
            "parts": [
                {
                    "text": (
                        "Sen Credentia uygulamasının akıllı asistanısın. "
                        "Kullanıcıyla samimi, doğal ve rahat bir sohbet gibi konuş. "
                        "Robot gibi uzun raporlar verme; önce kullanıcıyı anladığını göster, sonra en önemli noktayı söyle. "
                        "Kullanıcının kayıtlı finans verileri verilmişse onları arka planda kullan; kullanıcı istemedikçe tüm sayıları tek tek dökme. "
                        "Verilmeyen kişisel bilgileri uydurma. "
                        "Credentia kullanımı, bütçe yönetimi, gelir-gider takibi, genel finansal okuryazarlık, planlama, üretkenlik, öğrenme ve günlük sorularda yardımcı ol. "
                        "Kullanıcı finans dışı bir şey sorarsa da kısa ve faydalı yanıt ver; ancak kişisel finans yorumu gerekiyorsa yalnızca verilen Credentia verilerine dayan. "
                        "Kısa, sade ve Türkçe cevap ver; kullanıcı istemedikçe 2-4 paragrafı geçme. "
                        "Gerektiğinde 'bence', 'şöyle yapabiliriz', 'burada dikkat çeken şey' gibi doğal ifadeler kullan. "
                        "Aşırı resmi, ders anlatır gibi veya tablo okur gibi konuşma. "
                        "Kesin finansal veya yatırım tavsiyesi verme. "
                        "Kripto, yatırım, al/sat veya garanti getiri yönlendirmesi yapma. "
                        "Kullanıcı özellikle istemedikçe cevap 3-5 cümleyi geçmesin. "
                        "Gerekirse verinin mevcut olmadığını açıkça söyle."
                    )
                }
            ]
        },
        "contents": history_to_contents(history, prompt),
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 420,
        },
    }


def extract_answer(payload: object) -> str:
    if not isinstance(payload, dict):
        raise AssistantProviderError("Gemini response is invalid")

    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise AssistantProviderError("Gemini response has no candidates")

    content = candidates[0].get("content") if isinstance(candidates[0], dict) else None
    parts = content.get("parts") if isinstance(content, dict) else None
    if not isinstance(parts, list):
        raise AssistantProviderError("Gemini response has no text")

    answer_parts = [part.get("text", "") for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str)]
    answer = " ".join(part.strip() for part in answer_parts if part.strip()).strip()
    if not answer:
        raise AssistantProviderError("Gemini response text is empty")

    return answer


def request_gemini_model(model_name: str, prompt: str, history: list[AssistantMessage]) -> str:
    model = quote(model_name, safe="")
    url = f"{GEMINI_API_URL.format(model=model)}?key={quote(settings.gemini_api_key or '')}"
    request = Request(
        url,
        data=json.dumps(gemini_payload(prompt, history), ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Credentia/0.1 assistant",
        },
        method="POST",
    )

    with urlopen(request, timeout=20) as response:
        response_payload = json.loads(response.read().decode("utf-8"))

    return extract_answer(response_payload)


def ask_gemini(prompt: str, history: list[AssistantMessage]) -> str:
    if not settings.gemini_api_key:
        raise AssistantConfigurationError("GEMINI_API_KEY is not configured")

    model_candidates = list(dict.fromkeys([settings.gemini_model, *GEMINI_FALLBACK_MODELS]))
    last_error: Exception | None = None

    for model_name in model_candidates:
        try:
            return request_gemini_model(model_name, prompt, history)
        except (HTTPError, URLError, TimeoutError, OSError, json.JSONDecodeError, AssistantProviderError) as exc:
            last_error = exc

    raise AssistantProviderError("Gemini request failed") from last_error


def build_assistant_answer(
    db: Session,
    user_id: int,
    message: str,
    year: int,
    month: int,
    history: list[AssistantMessage],
) -> tuple[str, dict[str, object]]:
    context = build_financial_context(db, user_id, year, month)
    answer = ask_gemini(build_prompt(message, context), history)
    return answer, context
