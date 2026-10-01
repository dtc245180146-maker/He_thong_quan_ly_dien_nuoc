import json
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceDetailResponse
from backend.app.services.invoice_service import InvoiceService
from backend.app.utils.security import get_current_user, require_admin, check_room_access

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.get("", response_model=list[InvoiceResponse])
def get_invoices(
    room_id: int = None,
    period: str = None,
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    UC006 / UC008: Danh sách hóa đơn
    - Admin: xem toàn bộ hóa đơn của tất cả các phòng.
    - User: chỉ xem hóa đơn thuộc phòng của mình.
    """
    if current_user.role == "ADMIN":
        invoices = InvoiceService.get_all(db, room_id, period, status_filter)
    else:
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        if not user_room:
            return []
        invoices = InvoiceService.get_all(db, user_room.id, period, status_filter)

    results = []
    for inv in invoices:
        results.append(InvoiceResponse(
            id=inv.id,
            invoice_code=inv.invoice_code,
            room_id=inv.room_id,
            room_code=inv.room.room_code if inv.room else None,
            room_name=inv.room.name if inv.room else None,
            period=inv.period,
            issue_date=inv.issue_date,
            due_date=inv.due_date,
            electricity_usage=inv.electricity_usage,
            electricity_cost=inv.electricity_cost,
            water_usage=inv.water_usage,
            water_cost=inv.water_cost,
            other_fees=inv.other_fees,
            total_amount=inv.total_amount,
            paid_amount=inv.paid_amount,
            remaining_amount=inv.remaining_amount,
            status=inv.status,
            notes=inv.notes,
            created_at=inv.created_at
        ))
    return results

@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice_detail(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xem chi tiết hóa đơn, bảng kê bậc thang và các lần thanh toán (TC12, TC13)"""
    inv = InvoiceService.get_by_id(db, invoice_id)
    # Kiểm tra quyền truy cập (TC13)
    check_room_access(current_user, inv.room_id, db)

    elec_details = []
    water_details = []
    if inv.electricity_details:
        try:
            elec_details = json.loads(inv.electricity_details)
        except Exception:
            elec_details = []

    if inv.water_details:
        try:
            water_details = json.loads(inv.water_details)
        except Exception:
            water_details = []

    payments_data = [
        {
            "id": p.id,
            "amount": p.amount,
            "payment_date": p.payment_date.isoformat(),
            "payment_method": p.payment_method,
            "transaction_code": p.transaction_code,
            "status": p.status,
            "notes": p.notes
        }
        for p in inv.payments
    ]

    return InvoiceDetailResponse(
        id=inv.id,
        invoice_code=inv.invoice_code,
        room_id=inv.room_id,
        room_code=inv.room.room_code if inv.room else None,
        room_name=inv.room.name if inv.room else None,
        period=inv.period,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        electricity_usage=inv.electricity_usage,
        electricity_cost=inv.electricity_cost,
        electricity_details=elec_details,
        water_usage=inv.water_usage,
        water_cost=inv.water_cost,
        water_details=water_details,
        other_fees=inv.other_fees,
        total_amount=inv.total_amount,
        paid_amount=inv.paid_amount,
        remaining_amount=inv.remaining_amount,
        status=inv.status,
        notes=inv.notes,
        created_at=inv.created_at,
        payments=payments_data
    )

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Lập hóa đơn theo kỳ và phòng (UC006, TC09, TC10)"""
    inv = InvoiceService.create(db, data)
    return InvoiceResponse(
        id=inv.id,
        invoice_code=inv.invoice_code,
        room_id=inv.room_id,
        room_code=inv.room.room_code if inv.room else None,
        room_name=inv.room.name if inv.room else None,
        period=inv.period,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        electricity_usage=inv.electricity_usage,
        electricity_cost=inv.electricity_cost,
        water_usage=inv.water_usage,
        water_cost=inv.water_cost,
        other_fees=inv.other_fees,
        total_amount=inv.total_amount,
        paid_amount=inv.paid_amount,
        remaining_amount=inv.remaining_amount,
        status=inv.status,
        notes=inv.notes,
        created_at=inv.created_at
    )

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Xóa hóa đơn chưa thanh toán"""
    return InvoiceService.delete(db, invoice_id)
