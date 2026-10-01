import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Cấu hình engine linh hoạt cho PostgreSQL và SQLite
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Database connected successfully with URL: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    logger.warning(f"Could not connect to configured DATABASE_URL: {e}. Falling back to SQLite.")
    db_url = "sqlite:///./dien_nuoc.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
