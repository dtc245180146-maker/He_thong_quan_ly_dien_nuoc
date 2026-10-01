from datetime import date, datetime
from pydantic import BaseModel, Field, model_validator
from typing import Optional

class MeterReadingBase(BaseModel):
    meter_id: int = Field(..., description="ID đồng hồ")
    room_id: int = Field(..., description="ID phòng/hộ")
    period: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Kỳ ghi dạng YYYY-MM")
    reading_date: date = Field(default_factory=date.today)
    old_reading: float = Field(..., ge=0.0, description="Chỉ số cũ, không được âm")
    new_reading: float = Field(..., ge=0.0, description="Chỉ số mới, không được âm")
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_readings(self):
        if self.new_reading < self.old_reading:
            raise ValueError("Chỉ số mới không được nhỏ hơn chỉ số cũ")
        return self

class MeterReadingCreate(MeterReadingBase):
    pass

class QuickRoomReadingCreate(BaseModel):
    room_id: int = Field(..., description="ID phòng")
    period: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Kỳ ghi YYYY-MM")
    reading_date: date = Field(default_factory=date.today)
    electricity_old: float = Field(..., ge=0.0, description="Chỉ số điện cũ")
    electricity_new: float = Field(..., ge=0.0, description="Chỉ số điện mới")
    water_old: float = Field(..., ge=0.0, description="Chỉ số nước cũ")
    water_new: float = Field(..., ge=0.0, description="Chỉ số nước mới")
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_both(self):
        if self.electricity_new < self.electricity_old:
            raise ValueError("Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ")
        if self.water_new < self.water_old:
            raise ValueError("Chỉ số nước mới không được nhỏ hơn chỉ số nước cũ")
        return self

class MeterReadingUpdate(BaseModel):
    old_reading: Optional[float] = Field(default=None, ge=0.0)
    new_reading: Optional[float] = Field(default=None, ge=0.0)
    reading_date: Optional[date] = None
    notes: Optional[str] = None

class MeterReadingResponse(BaseModel):
    id: int
    meter_id: int
    room_id: int
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    meter_code: Optional[str] = None
    meter_type: Optional[str] = None
    unit: Optional[str] = None
    period: str
    reading_date: date
    old_reading: float
    new_reading: float
    consumption: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
