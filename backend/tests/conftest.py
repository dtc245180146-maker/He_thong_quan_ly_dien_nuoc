import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Đảm bảo import được backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.utils.seed_data import seed_database
from backend.app.utils.security import create_access_token
from backend.app.models.user import User

# Sử dụng database test riêng trong bộ nhớ hoặc file test.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dien_nuoc.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_dien_nuoc.db"):
        try:
            os.remove("./test_dien_nuoc.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def admin_headers():
    token = create_access_token({"sub": "admin", "user_id": 1, "role": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def user_headers():
    token = create_access_token({"sub": "user_p101", "user_id": 2, "role": "USER", "room_id": 1})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def other_user_headers():
    token = create_access_token({"sub": "user_p102", "user_id": 3, "role": "USER", "room_id": 2})
    return {"Authorization": f"Bearer {token}"}
