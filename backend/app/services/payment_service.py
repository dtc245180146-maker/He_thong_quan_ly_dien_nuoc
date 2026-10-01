from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.payment import Payment
from backend.app.models.invoice import Invoice
from backend.app.schemas.payment import PaymentCreate

class PaymentService:
    @staticmethod
    def get_all(db: Session, invoice_id: int = None) -> list[Payment]:
        query = db.query(Payment)
        if invoice_id:
            query = query.filter(Payment.invoice_id == invoice_id)
        return query.order_by(Payment.payment_date.desc()).all()

    @staticmethod
    def create(db: Session, data: PaymentCreate) -> Payment:
        # 1. Kiểm tra số tiền
        if data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số tiền thanh toán phải lớn hơn 0."
            )

        # 2. Kiểm tra hóa đơn
        invoice = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hóa đơn này.")

        if invoice.remaining_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hóa đơn này đã được thanh toán đầy đủ."
            )

        if data.amount > invoice.remaining_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số tiền thanh toán ({data.amount:,.0f} VNĐ) vượt quá số nợ còn lại ({invoice.remaining_amount:,.0f} VNĐ)."
            )

        # 3. Tạo giao dịch thanh toán
        payment = Payment(
            invoice_id=data.invoice_id,
            amount=data.amount,
            payment_date=datetime.utcnow(),
            payment_method=data.payment_method,
            transaction_code=data.transaction_code,
            status="COMPLETED",
            notes=data.notes
        )
        db.add(payment)

        # 4. Cập nhật hóa đơn
        invoice.paid_amount = round(invoice.paid_amount + data.amount, 2)
        invoice.remaining_amount = round(max(0.0, invoice.total_amount - invoice.paid_amount), 2)

        if invoice.remaining_amount <= 0:
            invoice.status = "PAID"
        else:
            invoice.status = "PARTIALLY_PAID"

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def get_by_id(db: Session, payment_id: int) -> Payment:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy giao dịch thanh toán.")
        return payment
