from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.schemas.room import RoomCreate, RoomUpdate, RoomResponse, RoomDetailResponse
from backend.app.services.room_service import RoomService
from backend.app.utils.security import get_current_user, require_admin, check_room_access

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.get("", response_model=list[RoomResponse])
def get_rooms(
    search: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    UC002 / UC008: Lấy danh sách hộ/phòng
    - Admin: xem tất cả các phòng.
    - User: chỉ xem phòng được phân quyền cho tài khoản của mình.
    """
    if current_user.role == "ADMIN":
        rooms = RoomService.get_all(db, search)
    else:
        rooms = db.query(Room).filter(Room.user_id == current_user.id).all()

    results = []
    for r in rooms:
        results.append(RoomResponse(
            id=r.id,
            room_code=r.room_code,
            name=r.name,
            address=r.address,
            resident_count=r.resident_count,
            phone=r.phone,
            is_active=r.is_active,
            user_id=r.user_id,
            created_at=r.created_at,
            user_name=r.user.username if r.user else None,
            user_full_name=r.user.full_name if r.user else None
        ))
    return results

@router.get("/{room_id}", response_model=RoomDetailResponse)
def get_room_detail(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chi tiết hộ/phòng và đồng hồ gắn liền (Kiểm tra phân quyền)"""
    room = check_room_access(current_user, room_id, db)
    meter_list = [
        {
            "id": m.id,
            "meter_code": m.meter_code,
            "meter_type": m.meter_type,
            "unit": m.unit,
            "is_active": m.is_active,
            "installation_date": m.installation_date.isoformat() if m.installation_date else None,
            "notes": m.notes
        }
        for m in room.meters
    ]
    return RoomDetailResponse(
        id=room.id,
        room_code=room.room_code,
        name=room.name,
        address=room.address,
        resident_count=room.resident_count,
        phone=room.phone,
        is_active=room.is_active,
        user_id=room.user_id,
        created_at=room.created_at,
        user_name=room.user.username if room.user else None,
        user_full_name=room.user.full_name if room.user else None,
        meters=meter_list
    )

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(data: RoomCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Tạo hộ/phòng mới (UC002, TC03, TC04)"""
    new_room = RoomService.create(db, data)
    return RoomResponse(
        id=new_room.id,
        room_code=new_room.room_code,
        name=new_room.name,
        address=new_room.address,
        resident_count=new_room.resident_count,
        phone=new_room.phone,
        is_active=new_room.is_active,
        user_id=new_room.user_id,
        created_at=new_room.created_at,
        user_name=new_room.user.username if new_room.user else None,
        user_full_name=new_room.user.full_name if new_room.user else None
    )

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, data: RoomUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Cập nhật hộ/phòng (UC002)"""
    room = RoomService.update(db, room_id, data)
    return RoomResponse(
        id=room.id,
        room_code=room.room_code,
        name=room.name,
        address=room.address,
        resident_count=room.resident_count,
        phone=room.phone,
        is_active=room.is_active,
        user_id=room.user_id,
        created_at=room.created_at,
        user_name=room.user.username if room.user else None,
        user_full_name=room.user.full_name if room.user else None
    )

@router.delete("/{room_id}")
def delete_room(room_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Xóa hộ/phòng (UC002)"""
    return RoomService.delete(db, room_id)
