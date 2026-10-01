from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. "HD-202608-P101"
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    period = Column(String(7), nullable=False, index=True)                     # Định dạng "YYYY-MM"
    issue_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=True)

    # Tiêu thụ & chi phí điện
    electricity_usage = Column(Float, default=0.0, nullable=False)             # kWh
    electricity_cost = Column(Float, default=0.0, nullable=False)              # VNĐ
    electricity_details = Column(Text, nullable=True)                          # Chi tiết tính tiền theo bậc (JSON)

    # Tiêu thụ & chi phí nước
    water_usage = Column(Float, default=0.0, nullable=False)                   # m³
    water_cost = Column(Float, default=0.0, nullable=False)                    # VNĐ
    water_details = Column(Text, nullable=True)                                # Chi tiết tính tiền theo bậc (JSON)

    # Chi phí phụ khác (nếu có)
    other_fees = Column(Float, default=0.0, nullable=False)

    # Tổng tiền & Thanh toán
    total_amount = Column(Float, nullable=False)                               # Tổng tiền hóa đơn
    paid_amount = Column(Float, default=0.0, nullable=False)                   # Số tiền đã thanh toán
    remaining_amount = Column(Float, nullable=False)                           # Số tiền còn nợ
    status = Column(String(30), default="UNPAID", nullable=False)              # "UNPAID", "PARTIALLY_PAID", "PAID"
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("room_id", "period", name="uix_room_invoice_period"),
    )

    # Quan hệ
    room = relationship("Room", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
