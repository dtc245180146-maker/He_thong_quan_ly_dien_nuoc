from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.user import UserCreate, UserUpdate, UserResponse
from backend.app.services.auth_service import AuthService
from backend.app.utils.security import require_admin
from backend.app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=list[UserResponse])
def get_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Danh sách toàn bộ người dùng"""
    return AuthService.list_users(db)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Tạo tài khoản người dùng mới"""
    return AuthService.create_user(db, data)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Cập nhật thông tin người dùng"""
    return AuthService.update_user(db, user_id, data)

@router.delete("/{user_id}")
def delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Xóa người dùng"""
    if admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tự xóa tài khoản của chính mình.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    db.delete(user)
    db.commit()
    return {"message": "Đã xóa người dùng thành công."}
