from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.reading import MeterReading
from backend.app.models.meter import Meter
from backend.app.models.room import Room
from backend.app.schemas.reading import MeterReadingCreate, QuickRoomReadingCreate, MeterReadingUpdate

class ReadingService:
    @staticmethod
    def get_all(db: Session, room_id: int = None, period: str = None, meter_type: str = None) -> list[MeterReading]:
        query = db.query(MeterReading).join(Meter).join(Room)
        if room_id:
            query = query.filter(MeterReading.room_id == room_id)
        if period:
            query = query.filter(MeterReading.period == period)
        if meter_type:
            query = query.filter(Meter.meter_type == meter_type)
        return query.order_by(MeterReading.period.desc(), Room.room_code.asc()).all()

    @staticmethod
    def get_by_id(db: Session, reading_id: int) -> MeterReading:
        reading = db.query(MeterReading).filter(MeterReading.id == reading_id).first()
        if not reading:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bản ghi chỉ số.")
        return reading

    @staticmethod
    def get_latest_reading_for_meter(db: Session, meter_id: int) -> MeterReading:
        return db.query(MeterReading).filter(
            MeterReading.meter_id == meter_id
        ).order_by(MeterReading.period.desc()).first()

    @staticmethod
    def create(db: Session, data: MeterReadingCreate) -> MeterReading:
        # 1. Kiểm tra đồng hồ
        meter = db.query(Meter).filter(Meter.id == data.meter_id).first()
        if not meter:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Đồng hồ không tồn tại.")

        # 2. Kiểm tra chỉ số không âm
        if data.old_reading < 0 or data.new_reading < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ số điện nước không được âm.")

        # 3. Chỉ số mới không được nhỏ hơn chỉ số cũ
        if data.new_reading < data.old_reading:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chỉ số mới không được nhỏ hơn chỉ số cũ."
            )

        # 4. Kiểm tra trùng kỳ
        existing = db.query(MeterReading).filter(
            MeterReading.meter_id == data.meter_id,
            MeterReading.period == data.period
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Đã tồn tại chỉ số cho đồng hồ {meter.meter_code} trong kỳ {data.period}. Không được nhập trùng kỳ."
            )

        consumption = data.new_reading - data.old_reading

        new_reading = MeterReading(
            meter_id=data.meter_id,
            room_id=meter.room_id,
            period=data.period,
            reading_date=data.reading_date or date.today(),
            old_reading=data.old_reading,
            new_reading=data.new_reading,
            consumption=consumption,
            notes=data.notes
        )
        db.add(new_reading)
        db.commit()
        db.refresh(new_reading)
        return new_reading

    @staticmethod
    def create_quick_room_reading(db: Session, data: QuickRoomReadingCreate) -> list[MeterReading]:
        """
        Nhập chỉ số đồng thời cho cả điện và nước của 1 phòng theo kỳ.
        """
        room = db.query(Room).filter(Room.id == data.room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hộ/phòng.")

        meters = db.query(Meter).filter(Meter.room_id == data.room_id, Meter.is_active == True).all()
        elec_meter = next((m for m in meters if m.meter_type == "ELECTRICITY"), None)
        water_meter = next((m for m in meters if m.meter_type == "WATER"), None)

        if not elec_meter or not water_meter:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phòng này chưa được cấu hình đầy đủ cả đồng hồ điện và đồng hồ nước."
            )

        results = []
        # Tạo bản ghi điện
        elec_item = MeterReadingCreate(
            meter_id=elec_meter.id,
            room_id=data.room_id,
            period=data.period,
            reading_date=data.reading_date,
            old_reading=data.electricity_old,
            new_reading=data.electricity_new,
            notes=data.notes
        )
        results.append(ReadingService.create(db, elec_item))

        # Tạo bản ghi nước
        water_item = MeterReadingCreate(
            meter_id=water_meter.id,
            room_id=data.room_id,
            period=data.period,
            reading_date=data.reading_date,
            old_reading=data.water_old,
            new_reading=data.water_new,
            notes=data.notes
        )
        results.append(ReadingService.create(db, water_item))

        return results

    @staticmethod
    def update(db: Session, reading_id: int, data: MeterReadingUpdate) -> MeterReading:
        reading = ReadingService.get_by_id(db, reading_id)

        old_val = data.old_reading if data.old_reading is not None else reading.old_reading
        new_val = data.new_reading if data.new_reading is not None else reading.new_reading

        if old_val < 0 or new_val < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ số không được âm.")
        if new_val < old_val:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ số mới không được nhỏ hơn chỉ số cũ.")

        reading.old_reading = old_val
        reading.new_reading = new_val
        reading.consumption = new_val - old_val
        if data.reading_date is not None:
            reading.reading_date = data.reading_date
        if data.notes is not None:
            reading.notes = data.notes

        db.commit()
        db.refresh(reading)
        return reading

    @staticmethod
    def delete(db: Session, reading_id: int) -> dict:
        reading = ReadingService.get_by_id(db, reading_id)
        db.delete(reading)
        db.commit()
        return {"message": "Đã xóa bản ghi chỉ số thành công."}
