from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MeterReading(Base):
    __tablename__ = "meter_readings"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("meters.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    period = Column(String(7), nullable=False, index=True)  # Định dạng "YYYY-MM", ví dụ "2026-08"
    reading_date = Column(Date, default=date.today, nullable=False)
    old_reading = Column(Float, nullable=False)             # Chỉ số cũ (>= 0)
    new_reading = Column(Float, nullable=False)             # Chỉ số mới (>= chỉ số cũ)
    consumption = Column(Float, nullable=False)             # Mức tiêu thụ = mới - cũ
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("meter_id", "period", name="uix_meter_period"),
    )

    # Quan hệ
    meter = relationship("Meter", back_populates="readings")
    room = relationship("Room", back_populates="readings")
