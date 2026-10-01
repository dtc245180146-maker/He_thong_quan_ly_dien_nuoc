from datetime import date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date
from backend.app.database import Base

class PriceConfig(Base):
    __tablename__ = "price_configs"

    id = Column(Integer, primary_key=True, index=True)
    service_type = Column(String(20), nullable=False)   # "ELECTRICITY" hoặc "WATER"
    pricing_type = Column(String(20), nullable=False)   # "TIERED" (bậc thang) hoặc "FIXED" (cố định)
    tier_name = Column(String(100), nullable=True)      # e.g. "Bậc 1 (0-50 kWh)", "Đơn giá cố định trọ"
    from_level = Column(Float, nullable=False, default=0.0)
    to_level = Column(Float, nullable=True)             # None = không giới hạn mức trên (e.g. > 400 kWh)
    unit_price = Column(Float, nullable=False)          # Đơn giá VNĐ (bắt buộc > 0)
    effective_date = Column(Date, default=date.today, nullable=False) # Ngày bắt đầu áp dụng
    expired_date = Column(Date, nullable=True)          # Ngày hết hạn
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(String(255), nullable=True)
