from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(50), unique=True, index=True, nullable=False)  # Mã phòng/hộ (duy nhất)
    name = Column(String(100), nullable=False)                               # Tên phòng/hộ
    address = Column(String(255), nullable=True)                              # Địa chỉ
    resident_count = Column(Integer, default=1, nullable=False)               # Số người
    phone = Column(String(20), nullable=True)                                 # Số điện thoại
    is_active = Column(Boolean, default=True, nullable=False)                # Trạng thái
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Quan hệ
    user = relationship("User", back_populates="rooms")
    meters = relationship("Meter", back_populates="room", cascade="all, delete-orphan")
    readings = relationship("MeterReading", back_populates="room", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="room", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="room", cascade="all, delete-orphan")
