from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.auth import LoginRequest, TokenResponse
from backend.app.schemas.user import UserResponse
from backend.app.services.auth_service import AuthService
from backend.app.utils.security import get_current_user, hash_password, verify_password
from backend.app.models.user import User
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới")

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """UC001: Đăng nhập hệ thống (Admin & User)"""
    return AuthService.authenticate(db, request)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Lấy thông tin người dùng hiện tại từ Token"""
    return current_user

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đổi mật khẩu cá nhân"""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác."
        )
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công."}
