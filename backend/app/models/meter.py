from datetime import date
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Meter(Base):
    __tablename__ = "meters"

    id = Column(Integer, primary_key=True, index=True)
    meter_code = Column(String(50), unique=True, index=True, nullable=False) # Mã đồng hồ (duy nhất)
    meter_type = Column(String(20), nullable=False)                          # "ELECTRICITY" hoặc "WATER"
    unit = Column(String(10), nullable=False)                                # "kWh" hoặc "m³"
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    installation_date = Column(Date, default=date.today, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(String(255), nullable=True)

    # Quan hệ
    room = relationship("Room", back_populates="meters")
    readings = relationship("MeterReading", back_populates="meter", cascade="all, delete-orphan")
