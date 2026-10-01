from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class RoomBase(BaseModel):
    room_code: str = Field(..., min_length=1, max_length=50, description="Mã phòng/hộ (duy nhất)")
    name: str = Field(..., min_length=1, max_length=100, description="Tên phòng/hộ")
    address: Optional[str] = None
    resident_count: int = Field(default=1, ge=1, description="Số người ở")
    phone: Optional[str] = None
    is_active: bool = True
    user_id: Optional[int] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    resident_count: Optional[int] = Field(default=None, ge=1)
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    user_id: Optional[int] = None

class RoomResponse(RoomBase):
    id: int
    created_at: datetime
    user_name: Optional[str] = None
    user_full_name: Optional[str] = None

    class Config:
        from_attributes = True

class RoomDetailResponse(RoomResponse):
    meters: List[dict] = []
