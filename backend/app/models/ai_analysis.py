from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    period = Column(String(7), nullable=False, index=True)     # Kỳ phân tích "YYYY-MM"
    analysis_type = Column(String(50), default="COMPREHENSIVE", nullable=False)
    input_data = Column(Text, nullable=True)                   # Dữ liệu tiêu thụ cung cấp cho AI
    summary = Column(Text, nullable=False)                     # Nhận xét xu hướng sử dụng
    alert = Column(Text, nullable=True)                        # Cảnh báo bất thường (nếu có tăng >30%)
    recommendations = Column(Text, nullable=True)              # Gợi ý tiết kiệm điện nước
    is_anomaly = Column(Boolean, default=False, nullable=False)# Cờ phát hiện bất thường (>30%)
    anomaly_details = Column(Text, nullable=True)              # Chi tiết mức tăng %
    provider = Column(String(50), default="mock", nullable=False) # Nhà cung cấp AI
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Quan hệ
    room = relationship("Room", back_populates="ai_analyses")
