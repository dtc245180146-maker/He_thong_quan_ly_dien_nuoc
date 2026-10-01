from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.schemas.user import UserCreate, UserUpdate
from backend.app.schemas.auth import LoginRequest, TokenResponse
from backend.app.utils.security import hash_password, verify_password, create_access_token

class AuthService:
    @staticmethod
    def authenticate(db: Session, login_data: LoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.username == login_data.username).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tên đăng nhập hoặc mật khẩu không chính xác."
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
            )

        # Lấy phòng được liên kết nếu là USER
        user_room = db.query(Room).filter(Room.user_id == user.id).first()
        room_id = user_room.id if user_room else None
        room_code = user_room.room_code if user_room else None

        token_data = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role,
            "room_id": room_id
        }
        token = create_access_token(token_data)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            room_id=room_id,
            room_code=room_code
        )

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        existing = db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên đăng nhập đã tồn tại trong hệ thống."
            )
        new_user = User(
            username=user_data.username,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.full_name,
            email=user_data.email,
            phone=user_data.phone,
            role=user_data.role,
            is_active=user_data.is_active
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.email is not None:
            user.email = user_data.email
        if user_data.phone is not None:
            user.phone = user_data.phone
        if user_data.role is not None:
            user.role = user_data.role
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        if user_data.password:
            user.hashed_password = hash_password(user_data.password)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def list_users(db: Session) -> list[User]:
        return db.query(User).order_by(User.id.asc()).all()
