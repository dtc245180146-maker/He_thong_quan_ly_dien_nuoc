from pydantic import BaseModel, Field
from typing import Optional

class LoginRequest(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: str
    room_id: Optional[int] = None
    room_code: Optional[str] = None

class TokenPayload(BaseModel):
    sub: str
    user_id: int
    role: str
