from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)                     # Số tiền thanh toán (> 0)
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    payment_method = Column(String(50), default="TIỀN MẶT", nullable=False) # "TIỀN MẶT", "CHUYỂN KHOẢN", v.v.
    transaction_code = Column(String(100), nullable=True)     # Mã giao dịch ngân hàng / tham chiếu
    status = Column(String(30), default="COMPLETED", nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Quan hệ
    invoice = relationship("Invoice", back_populates="payments")
