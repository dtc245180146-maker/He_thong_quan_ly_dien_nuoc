from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), nullable=False, default="USER")  # "ADMIN" hoặc "USER"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Quan hệ
    rooms = relationship("Room", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
