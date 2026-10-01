from datetime import date
from pydantic import BaseModel, Field
from typing import Optional

class MeterBase(BaseModel):
    meter_code: str = Field(..., min_length=1, max_length=50, description="Mã đồng hồ")
    meter_type: str = Field(..., pattern="^(ELECTRICITY|WATER)$", description="Loại đồng hồ: ELECTRICITY hoặc WATER")
    unit: str = Field(default="kWh", description="kWh hoặc m³")
    room_id: int = Field(..., description="ID phòng/hộ gắn đồng hồ")
    installation_date: Optional[date] = None
    is_active: bool = True
    notes: Optional[str] = None

class MeterCreate(MeterBase):
    pass

class MeterUpdate(BaseModel):
    meter_code: Optional[str] = None
    meter_type: Optional[str] = None
    unit: Optional[str] = None
    room_id: Optional[int] = None
    installation_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class MeterResponse(MeterBase):
    id: int
    room_code: Optional[str] = None
    room_name: Optional[str] = None

    class Config:
        from_attributes = True
