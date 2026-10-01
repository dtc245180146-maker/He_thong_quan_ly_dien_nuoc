from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.meter import Meter
from backend.app.models.room import Room
from backend.app.schemas.meter import MeterCreate, MeterUpdate

class MeterService:
    @staticmethod
    def get_all(db: Session, room_id: int = None, meter_type: str = None) -> list[Meter]:
        query = db.query(Meter)
        if room_id:
            query = query.filter(Meter.room_id == room_id)
        if meter_type:
            query = query.filter(Meter.meter_type == meter_type)
        return query.order_by(Meter.meter_code.asc()).all()

    @staticmethod
    def get_by_id(db: Session, meter_id: int) -> Meter:
        meter = db.query(Meter).filter(Meter.id == meter_id).first()
        if not meter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đồng hồ này.")
        return meter

    @staticmethod
    def create(db: Session, data: MeterCreate) -> Meter:
        # Kiểm tra phòng tồn tại
        room = db.query(Room).filter(Room.id == data.room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hộ/phòng liên kết không tồn tại.")

        # Kiểm tra trùng mã đồng hồ
        existing = db.query(Meter).filter(Meter.meter_code == data.meter_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã đồng hồ '{data.meter_code}' đã tồn tại trong hệ thống."
            )

        unit = data.unit or ("kWh" if data.meter_type == "ELECTRICITY" else "m³")
        new_meter = Meter(
            meter_code=data.meter_code.strip(),
            meter_type=data.meter_type,
            unit=unit,
            room_id=data.room_id,
            installation_date=data.installation_date,
            is_active=data.is_active,
            notes=data.notes
        )
        db.add(new_meter)
        db.commit()
        db.refresh(new_meter)
        return new_meter

    @staticmethod
    def update(db: Session, meter_id: int, data: MeterUpdate) -> Meter:
        meter = MeterService.get_by_id(db, meter_id)
        if data.meter_code and data.meter_code != meter.meter_code:
            existing = db.query(Meter).filter(Meter.meter_code == data.meter_code).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mã đồng hồ đã tồn tại.")
            meter.meter_code = data.meter_code.strip()

        if data.meter_type is not None:
            meter.meter_type = data.meter_type
        if data.unit is not None:
            meter.unit = data.unit
        if data.room_id is not None:
            room = db.query(Room).filter(Room.id == data.room_id).first()
            if not room:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Hộ/phòng không tồn tại.")
            meter.room_id = data.room_id
        if data.installation_date is not None:
            meter.installation_date = data.installation_date
        if data.is_active is not None:
            meter.is_active = data.is_active
        if data.notes is not None:
            meter.notes = data.notes

        db.commit()
        db.refresh(meter)
        return meter

    @staticmethod
    def delete(db: Session, meter_id: int) -> dict:
        meter = MeterService.get_by_id(db, meter_id)
        db.delete(meter)
        db.commit()
        return {"message": f"Đã xóa thành công đồng hồ {meter.meter_code}."}
