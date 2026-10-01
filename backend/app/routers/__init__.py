from backend.app.routers.auth import router as auth_router
from backend.app.routers.users import router as users_router
from backend.app.routers.rooms import router as rooms_router
from backend.app.routers.meters import router as meters_router
from backend.app.routers.prices import router as prices_router
from backend.app.routers.readings import router as readings_router
from backend.app.routers.invoices import router as invoices_router
from backend.app.routers.payments import router as payments_router
from backend.app.routers.stats import router as stats_router
from backend.app.routers.ai import router as ai_router
from backend.app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "users_router",
    "rooms_router",
    "meters_router",
    "prices_router",
    "readings_router",
    "invoices_router",
    "payments_router",
    "stats_router",
    "ai_router",
    "notifications_router",
]
