from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.models.invoice import Invoice
from backend.app.schemas.payment import PaymentCreate, PaymentResponse
from backend.app.services.payment_service import PaymentService
from backend.app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.get("", response_model=list[PaymentResponse])
def get_payments(
    invoice_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """UC007: Tra cứu lịch sử thanh toán"""
    if current_user.role == "ADMIN":
        payments = PaymentService.get_all(db, invoice_id)
    else:
        # Lọc các thanh toán thuộc về phòng của user
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        if not user_room:
            return []
        user_invoice_ids = [inv.id for inv in user_room.invoices]
        if invoice_id and invoice_id not in user_invoice_ids:
            return []
        target_ids = [invoice_id] if invoice_id else user_invoice_ids
        payments = db.query(Invoice.payments).filter(Invoice.id.in_(target_ids)).all() if target_ids else []
        payments = [p for inv in user_room.invoices for p in inv.payments if (not invoice_id or p.invoice_id == invoice_id)]

    results = []
    for p in payments:
        inv = p.invoice
        results.append(PaymentResponse(
            id=p.id,
            invoice_id=p.invoice_id,
            invoice_code=inv.invoice_code if inv else None,
            room_code=inv.room.room_code if inv and inv.room else None,
            room_name=inv.room.name if inv and inv.room else None,
            amount=p.amount,
            payment_date=p.payment_date,
            payment_method=p.payment_method,
            transaction_code=p.transaction_code,
            status=p.status,
            notes=p.notes,
            created_at=p.created_at
        ))
    return results

@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    data: PaymentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Ghi nhận thanh toán và cập nhật công nợ (UC007, TC11)"""
    p = PaymentService.create(db, data)
    inv = p.invoice
    return PaymentResponse(
        id=p.id,
        invoice_id=p.invoice_id,
        invoice_code=inv.invoice_code if inv else None,
        room_code=inv.room.room_code if inv and inv.room else None,
        room_name=inv.room.name if inv and inv.room else None,
        amount=p.amount,
        payment_date=p.payment_date,
        payment_method=p.payment_method,
        transaction_code=p.transaction_code,
        status=p.status,
        notes=p.notes,
        created_at=p.created_at
    )
