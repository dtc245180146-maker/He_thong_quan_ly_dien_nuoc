from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class PaymentCreate(BaseModel):
    invoice_id: int = Field(..., description="ID hóa đơn")
    amount: float = Field(..., gt=0.0, description="Số tiền thanh toán phải > 0")
    payment_method: str = Field(default="TIỀN MẶT", description="Phương thức: TIỀN MẶT, CHUYỂN KHOẢN, v.v.")
    transaction_code: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    invoice_code: Optional[str] = None
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    amount: float
    payment_date: datetime
    payment_method: str
    transaction_code: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
