import os
from pathlib import Path
from dotenv import load_dotenv

# Tìm file .env ở thư mục gốc hoặc thư mục hiện tại
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Hệ thống quản lý hóa đơn điện nước có tích hợp AI")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # JWT Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-change-in-production-2026-dien-nuoc-ai")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dien_nuoc.db")

    # AI Provider Settings
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock").lower()
    AI_TIMEOUT_SECONDS: int = int(os.getenv("AI_TIMEOUT_SECONDS", "15"))

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

settings = Settings()
