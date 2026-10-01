from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.room import Room
from backend.app.models.user import User
from backend.app.schemas.room import RoomCreate, RoomUpdate

class RoomService:
    @staticmethod
    def get_all(db: Session, search: str = None) -> list[Room]:
        query = db.query(Room)
        if search:
            query = query.filter(
                (Room.room_code.ilike(f"%{search}%")) |
                (Room.name.ilike(f"%{search}%"))
            )
        return query.order_by(Room.room_code.asc()).all()

    @staticmethod
    def get_by_id(db: Session, room_id: int) -> Room:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hộ/phòng này.")
        return room

    @staticmethod
    def create(db: Session, data: RoomCreate) -> Room:
        existing = db.query(Room).filter(Room.room_code == data.room_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mã hộ/phòng '{data.room_code}' đã tồn tại trong hệ thống."
            )

        if data.user_id:
            user = db.query(User).filter(User.id == data.user_id).first()
            if not user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Người dùng được liên kết không tồn tại.")

        new_room = Room(
            room_code=data.room_code.strip(),
            name=data.name.strip(),
            address=data.address,
            resident_count=data.resident_count,
            phone=data.phone,
            is_active=data.is_active,
            user_id=data.user_id
        )
        db.add(new_room)
        db.commit()
        db.refresh(new_room)
        return new_room

    @staticmethod
    def update(db: Session, room_id: int, data: RoomUpdate) -> Room:
        room = RoomService.get_by_id(db, room_id)

        if data.user_id is not None:
            if data.user_id > 0:
                user = db.query(User).filter(User.id == data.user_id).first()
                if not user:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Người dùng liên kết không tồn tại.")
                room.user_id = data.user_id
            else:
                room.user_id = None

        if data.name is not None:
            room.name = data.name.strip()
        if data.address is not None:
            room.address = data.address
        if data.resident_count is not None:
            room.resident_count = data.resident_count
        if data.phone is not None:
            room.phone = data.phone
        if data.is_active is not None:
            room.is_active = data.is_active

        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def delete(db: Session, room_id: int) -> dict:
        room = RoomService.get_by_id(db, room_id)
        # Kiểm tra dữ liệu liên quan
        if room.invoices and len(room.invoices) > 0:
            # Nếu đã có hóa đơn, để bảo vệ toàn vẹn lịch sử, có thể khóa trạng thái hoặc thông báo
            # Nhưng cho phép xóa nếu Admin xác nhận (hoặc cascade)
            pass
        db.delete(room)
        db.commit()
        return {"message": f"Đã xóa thành công hộ/phòng {room.room_code}."}
