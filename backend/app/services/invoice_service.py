import json
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.invoice import Invoice
from backend.app.models.room import Room
from backend.app.models.meter import Meter
from backend.app.models.reading import MeterReading
from backend.app.schemas.invoice import InvoiceCreate
from backend.app.services.price_service import PriceService

class InvoiceService:
    @staticmethod
    def get_all(db: Session, room_id: int = None, period: str = None, status_filter: str = None) -> list[Invoice]:
        query = db.query(Invoice).join(Room)
        if room_id:
            query = query.filter(Invoice.room_id == room_id)
        if period:
            query = query.filter(Invoice.period == period)
        if status_filter:
            query = query.filter(Invoice.status == status_filter)
        return query.order_by(Invoice.period.desc(), Room.room_code.asc()).all()

    @staticmethod
    def get_by_id(db: Session, invoice_id: int) -> Invoice:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hóa đơn này.")
        return invoice

    @staticmethod
    def create(db: Session, data: InvoiceCreate) -> Invoice:
        room = db.query(Room).filter(Room.id == data.room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hộ/phòng.")

        # 1. Kiểm tra hóa đơn đã tồn tại cho phòng và kỳ này chưa (TC10)
        existing_invoice = db.query(Invoice).filter(
            Invoice.room_id == data.room_id,
            Invoice.period == data.period
        ).first()
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Hóa đơn kỳ {data.period} cho phòng {room.room_code} đã tồn tại (Mã: {existing_invoice.invoice_code}). Không được tạo trùng."
            )

        # 2. Tìm chỉ số điện và nước cho phòng và kỳ này
        readings = db.query(MeterReading).join(Meter).filter(
            MeterReading.room_id == data.room_id,
            MeterReading.period == data.period
        ).all()

        elec_reading = next((r for r in readings if r.meter.meter_type == "ELECTRICITY"), None)
        water_reading = next((r for r in readings if r.meter.meter_type == "WATER"), None)

        if not elec_reading and not water_reading:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chưa có chỉ số điện hoặc nước cho phòng {room.room_code} trong kỳ {data.period}. Vui lòng nhập chỉ số trước."
            )

        elec_usage = elec_reading.consumption if elec_reading else 0.0
        water_usage = water_reading.consumption if water_reading else 0.0

        # 3. Tính tiền điện theo cấu hình đơn giá
        elec_cost, elec_details = PriceService.calculate_cost(db, "ELECTRICITY", elec_usage)

        # 4. Tính tiền nước theo cấu hình đơn giá
        water_cost, water_details = PriceService.calculate_cost(db, "WATER", water_usage)

        # 5. Tổng tiền
        total_amount = round(elec_cost + water_cost + data.other_fees, 2)
        invoice_code = f"HD-{data.period.replace('-', '')}-{room.room_code}"

        # Đảm bảo mã hóa đơn duy nhất
        dup_code = db.query(Invoice).filter(Invoice.invoice_code == invoice_code).first()
        if dup_code:
            invoice_code = f"{invoice_code}-{int(date.today().strftime('%d%H%M'))}"

        new_invoice = Invoice(
            invoice_code=invoice_code,
            room_id=data.room_id,
            period=data.period,
            issue_date=date.today(),
            due_date=data.due_date,
            electricity_usage=elec_usage,
            electricity_cost=round(elec_cost, 2),
            electricity_details=json.dumps(elec_details, ensure_ascii=False),
            water_usage=water_usage,
            water_cost=round(water_cost, 2),
            water_details=json.dumps(water_details, ensure_ascii=False),
            other_fees=data.other_fees,
            total_amount=total_amount,
            paid_amount=0.0,
            remaining_amount=total_amount,
            status="UNPAID",
            notes=data.notes
        )

        db.add(new_invoice)
        db.commit()
        db.refresh(new_invoice)
        return new_invoice

    @staticmethod
    def delete(db: Session, invoice_id: int) -> dict:
        invoice = InvoiceService.get_by_id(db, invoice_id)
        if invoice.paid_amount > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xóa hóa đơn đã có giao dịch thanh toán. Vui lòng kiểm tra lại."
            )
        db.delete(invoice)
        db.commit()
        return {"message": "Đã xóa hóa đơn thành công."}
