from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.schemas.reading import (
    MeterReadingCreate,
    QuickRoomReadingCreate,
    MeterReadingUpdate,
    MeterReadingResponse
)
from backend.app.services.reading_service import ReadingService
from backend.app.utils.security import get_current_user, require_admin, check_room_access

router = APIRouter(prefix="/api/readings", tags=["Meter Readings"])

@router.get("", response_model=list[MeterReadingResponse])
def get_readings(
    room_id: int = None,
    period: str = None,
    meter_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """UC005 / UC008: Lấy danh sách chỉ số điện nước theo kỳ và phòng"""
    if current_user.role == "ADMIN":
        readings = ReadingService.get_all(db, room_id, period, meter_type)
    else:
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        if not user_room:
            return []
        readings = ReadingService.get_all(db, user_room.id, period, meter_type)

    results = []
    for r in readings:
        results.append(MeterReadingResponse(
            id=r.id,
            meter_id=r.meter_id,
            room_id=r.room_id,
            room_code=r.room.room_code if r.room else None,
            room_name=r.room.name if r.room else None,
            meter_code=r.meter.meter_code if r.meter else None,
            meter_type=r.meter.meter_type if r.meter else None,
            unit=r.meter.unit if r.meter else None,
            period=r.period,
            reading_date=r.reading_date,
            old_reading=r.old_reading,
            new_reading=r.new_reading,
            consumption=r.consumption,
            notes=r.notes,
            created_at=r.created_at
        ))
    return results

@router.get("/latest/{meter_id}")
def get_latest_meter_reading(
    meter_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy chỉ số cũ gần nhất của đồng hồ để gợi ý nhập liệu tự động"""
    latest = ReadingService.get_latest_reading_for_meter(db, meter_id)
    if not latest:
        return {"has_previous": False, "latest_reading": 0.0, "latest_period": None}
    return {
        "has_previous": True,
        "latest_reading": latest.new_reading,
        "latest_period": latest.period
    }

@router.post("", response_model=MeterReadingResponse, status_code=status.HTTP_201_CREATED)
def create_reading(
    data: MeterReadingCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Nhập chỉ số đồng hồ đơn lẻ (UC005, TC07, TC08)"""
    r = ReadingService.create(db, data)
    return MeterReadingResponse(
        id=r.id,
        meter_id=r.meter_id,
        room_id=r.room_id,
        room_code=r.room.room_code if r.room else None,
        room_name=r.room.name if r.room else None,
        meter_code=r.meter.meter_code if r.meter else None,
        meter_type=r.meter.meter_type if r.meter else None,
        unit=r.meter.unit if r.meter else None,
        period=r.period,
        reading_date=r.reading_date,
        old_reading=r.old_reading,
        new_reading=r.new_reading,
        consumption=r.consumption,
        notes=r.notes,
        created_at=r.created_at
    )

@router.post("/quick-room", response_model=list[MeterReadingResponse], status_code=status.HTTP_201_CREATED)
def create_quick_room_reading(
    data: QuickRoomReadingCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Nhập nhanh cả chỉ số điện và nước cho phòng theo kỳ"""
    readings = ReadingService.create_quick_room_reading(db, data)
    results = []
    for r in readings:
        results.append(MeterReadingResponse(
            id=r.id,
            meter_id=r.meter_id,
            room_id=r.room_id,
            room_code=r.room.room_code if r.room else None,
            room_name=r.room.name if r.room else None,
            meter_code=r.meter.meter_code if r.meter else None,
            meter_type=r.meter.meter_type if r.meter else None,
            unit=r.meter.unit if r.meter else None,
            period=r.period,
            reading_date=r.reading_date,
            old_reading=r.old_reading,
            new_reading=r.new_reading,
            consumption=r.consumption,
            notes=r.notes,
            created_at=r.created_at
        ))
    return results

@router.put("/{reading_id}", response_model=MeterReadingResponse)
def update_reading(
    reading_id: int,
    data: MeterReadingUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Sửa bản ghi chỉ số"""
    r = ReadingService.update(db, reading_id, data)
    return MeterReadingResponse(
        id=r.id,
        meter_id=r.meter_id,
        room_id=r.room_id,
        room_code=r.room.room_code if r.room else None,
        room_name=r.room.name if r.room else None,
        meter_code=r.meter.meter_code if r.meter else None,
        meter_type=r.meter.meter_type if r.meter else None,
        unit=r.meter.unit if r.meter else None,
        period=r.period,
        reading_date=r.reading_date,
        old_reading=r.old_reading,
        new_reading=r.new_reading,
        consumption=r.consumption,
        notes=r.notes,
        created_at=r.created_at
    )

@router.delete("/{reading_id}")
def delete_reading(
    reading_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Xóa bản ghi chỉ số"""
    return ReadingService.delete(db, reading_id)
