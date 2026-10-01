from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Any

class InvoiceCreate(BaseModel):
    room_id: int = Field(..., description="ID phòng/hộ")
    period: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Kỳ hóa đơn YYYY-MM")
    due_date: Optional[date] = None
    other_fees: float = Field(default=0.0, ge=0.0, description="Phí dịch vụ khác (nếu có)")
    notes: Optional[str] = None

class TierDetail(BaseModel):
    tier_name: str
    from_level: float
    to_level: Optional[float] = None
    unit_price: float
    usage_in_tier: float
    cost: float

class InvoiceResponse(BaseModel):
    id: int
    invoice_code: str
    room_id: int
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    period: str
    issue_date: date
    due_date: Optional[date] = None
    electricity_usage: float
    electricity_cost: float
    water_usage: float
    water_cost: float
    other_fees: float
    total_amount: float
    paid_amount: float
    remaining_amount: float
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceDetailResponse(InvoiceResponse):
    electricity_details: Optional[Any] = None
    water_details: Optional[Any] = None
    payments: List[dict] = []
