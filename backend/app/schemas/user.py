from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=150)
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = Field(default="USER", pattern="^(ADMIN|USER)$")
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Mật khẩu tối thiểu 6 ký tự")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
