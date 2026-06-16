from fastapi import APIRouter

from app.modules.ai_rivals.routes import router as ai_rivals_router
from app.modules.analytics.routes import router as analytics_router
from app.modules.assistant.routes import router as assistant_router
from app.modules.auth.routes import router as auth_router
from app.modules.budgets.routes import router as budgets_router
from app.modules.categories.routes import router as categories_router
from app.modules.crisis_scenarios.routes import router as crisis_scenarios_router
from app.modules.investment_simulation.routes import router as investment_simulation_router
from app.modules.reports.routes import router as reports_router
from app.modules.transactions.routes import router as transactions_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets_router, prefix="/budgets", tags=["budgets"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(assistant_router, prefix="/assistant", tags=["assistant"])
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(investment_simulation_router, prefix="/investment-simulation", tags=["investment-simulation"])
api_router.include_router(ai_rivals_router, prefix="/ai-rivals", tags=["ai-rivals"])
api_router.include_router(crisis_scenarios_router, prefix="/crisis-scenarios", tags=["crisis-scenarios"])
