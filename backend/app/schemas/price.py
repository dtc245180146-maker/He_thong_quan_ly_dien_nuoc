from datetime import date
from pydantic import BaseModel, Field, model_validator
from typing import Optional

class PriceConfigBase(BaseModel):
    service_type: str = Field(..., pattern="^(ELECTRICITY|WATER)$", description="ELECTRICITY hoặc WATER")
    pricing_type: str = Field(default="TIERED", pattern="^(TIERED|FIXED)$", description="TIERED hoặc FIXED")
    tier_name: Optional[str] = Field(None, description="Tên bậc hoặc tên gói giá")
    from_level: float = Field(default=0.0, ge=0.0, description="Mức tiêu thụ bắt đầu")
    to_level: Optional[float] = Field(None, description="Mức tiêu thụ kết thúc (None = không giới hạn)")
    unit_price: float = Field(..., gt=0.0, description="Đơn giá VNĐ, phải > 0")
    effective_date: date = Field(default_factory=date.today, description="Ngày bắt đầu áp dụng")
    expired_date: Optional[date] = None
    is_active: bool = True
    description: Optional[str] = None

    @model_validator(mode="after")
    def validate_levels(self):
        if self.to_level is not None and self.to_level <= self.from_level:
            raise ValueError("Mức tiêu thụ kết thúc (to_level) phải lớn hơn mức bắt đầu (from_level)")
        if self.expired_date is not None and self.expired_date < self.effective_date:
            raise ValueError("Ngày hết hạn không được trước ngày áp dụng")
        return self

class PriceConfigCreate(PriceConfigBase):
    pass

class PriceConfigUpdate(BaseModel):
    tier_name: Optional[str] = None
    from_level: Optional[float] = Field(default=None, ge=0.0)
    to_level: Optional[float] = None
    unit_price: Optional[float] = Field(default=None, gt=0.0)
    effective_date: Optional[date] = None
    expired_date: Optional[date] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class PriceConfigResponse(PriceConfigBase):
    id: int

    class Config:
        from_attributes = True
