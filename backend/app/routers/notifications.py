from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.models.notification import Notification
from backend.app.schemas.notification import NotificationResponse, NotificationCreate
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy danh sách thông báo của người dùng hoặc phòng"""
    query = db.query(Notification)
    if current_user.role != "ADMIN":
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        room_id = user_room.id if user_room else None
        query = query.filter(
            (Notification.user_id == current_user.id) |
            (Notification.room_id == room_id) |
            (Notification.user_id == None)
        )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    return query.order_by(Notification.created_at.desc()).limit(30).all()

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đánh dấu thông báo đã đọc"""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thông báo.")
    notif.is_read = True
    db.commit()
    return {"message": "Đã đánh dấu đã đọc."}

@router.put("/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Đánh dấu toàn bộ thông báo đã đọc"""
    if current_user.role == "ADMIN":
        db.query(Notification).update({Notification.is_read: True})
    else:
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        room_id = user_room.id if user_room else None
        db.query(Notification).filter(
            (Notification.user_id == current_user.id) |
            (Notification.room_id == room_id)
        ).update({Notification.is_read: True})
    db.commit()
    return {"message": "Đã đánh dấu tất cả là đã đọc."}
