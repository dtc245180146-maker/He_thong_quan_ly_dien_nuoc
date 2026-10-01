import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.utils.seed_data import seed_database
import backend.app.models # Nạp models để SQLAlchemy biết bảng

from backend.app.routers import (
    auth_router,
    users_router,
    rooms_router,
    meters_router,
    prices_router,
    readings_router,
    invoices_router,
    payments_router,
    stats_router,
    ai_router,
    notifications_router
)

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("he_thong_dien_nuoc")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo bảng CSDL khi khởi động ứng dụng
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized.")

    # Tự động nạp dữ liệu mẫu nếu CSDL chưa có dữ liệu
    db = SessionLocal()
    try:
        res = seed_database(db)
        logger.info(f"Seed status: {res.get('message')}")
    except Exception as e:
        logger.warning(f"Error during auto-seeding: {e}")
    finally:
        db.close()

    yield
    logger.info("Application shutdown.")

app = FastAPI(
    title="Hệ thống quản lý hóa đơn điện nước có tích hợp AI",
    description="REST API cho hệ thống quản lý điện nước hộ gia đình / khu trọ, tích hợp phân tích và cảnh báo bất thường AI.",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS cho phép Frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép phát triển linh hoạt ở localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn các routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rooms_router)
app.include_router(meters_router)
app.include_router(prices_router)
app.include_router(readings_router)
app.include_router(invoices_router)
app.include_router(payments_router)
app.include_router(stats_router)
app.include_router(ai_router)
app.include_router(notifications_router)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "ai_provider": settings.AI_PROVIDER
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_provider": settings.AI_PROVIDER
    }
