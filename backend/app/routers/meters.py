from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.schemas.meter import MeterCreate, MeterUpdate, MeterResponse
from backend.app.services.meter_service import MeterService
from backend.app.utils.security import get_current_user, require_admin, check_room_access

router = APIRouter(prefix="/api/meters", tags=["Meters"])

@router.get("", response_model=list[MeterResponse])
def get_meters(
    room_id: int = None,
    meter_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """UC003: Danh sách đồng hồ điện/nước (Phân quyền Admin/User)"""
    if current_user.role == "ADMIN":
        meters = MeterService.get_all(db, room_id, meter_type)
    else:
        # User chỉ xem đồng hồ phòng của mình
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        if not user_room:
            return []
        meters = MeterService.get_all(db, user_room.id, meter_type)

    results = []
    for m in meters:
        results.append(MeterResponse(
            id=m.id,
            meter_code=m.meter_code,
            meter_type=m.meter_type,
            unit=m.unit,
            room_id=m.room_id,
            installation_date=m.installation_date,
            is_active=m.is_active,
            notes=m.notes,
            room_code=m.room.room_code if m.room else None,
            room_name=m.room.name if m.room else None
        ))
    return results

@router.get("/{meter_id}", response_model=MeterResponse)
def get_meter(
    meter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy thông tin đồng hồ"""
    meter = MeterService.get_by_id(db, meter_id)
    check_room_access(current_user, meter.room_id, db)
    return MeterResponse(
        id=meter.id,
        meter_code=meter.meter_code,
        meter_type=meter.meter_type,
        unit=meter.unit,
        room_id=meter.room_id,
        installation_date=meter.installation_date,
        is_active=meter.is_active,
        notes=meter.notes,
        room_code=meter.room.room_code if meter.room else None,
        room_name=meter.room.name if meter.room else None
    )

@router.post("", response_model=MeterResponse, status_code=status.HTTP_201_CREATED)
def create_meter(data: MeterCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Thêm đồng hồ và liên kết phòng (UC003, TC05)"""
    new_meter = MeterService.create(db, data)
    return MeterResponse(
        id=new_meter.id,
        meter_code=new_meter.meter_code,
        meter_type=new_meter.meter_type,
        unit=new_meter.unit,
        room_id=new_meter.room_id,
        installation_date=new_meter.installation_date,
        is_active=new_meter.is_active,
        notes=new_meter.notes,
        room_code=new_meter.room.room_code if new_meter.room else None,
        room_name=new_meter.room.name if new_meter.room else None
    )

@router.put("/{meter_id}", response_model=MeterResponse)
def update_meter(meter_id: int, data: MeterUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Cập nhật thông tin đồng hồ"""
    m = MeterService.update(db, meter_id, data)
    return MeterResponse(
        id=m.id,
        meter_code=m.meter_code,
        meter_type=m.meter_type,
        unit=m.unit,
        room_id=m.room_id,
        installation_date=m.installation_date,
        is_active=m.is_active,
        notes=m.notes,
        room_code=m.room.room_code if m.room else None,
        room_name=m.room.name if m.room else None
    )

@router.delete("/{meter_id}")
def delete_meter(meter_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Xóa đồng hồ"""
    return MeterService.delete(db, meter_id)
