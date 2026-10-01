from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AIAnalyzeRequest(BaseModel):
    room_id: int = Field(..., description="ID phòng/hộ cần phân tích")
    period: Optional[str] = Field(None, description="Kỳ phân tích YYYY-MM (mặc định lấy kỳ mới nhất)")

class AISavingsRequest(BaseModel):
    room_id: int = Field(..., description="ID phòng/hộ cần gợi ý tiết kiệm")

class AIAnalyzeResponse(BaseModel):
    id: Optional[int] = None
    room_id: int
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    period: str
    summary: str
    alert: Optional[str] = None
    recommendations: Optional[str] = None
    is_anomaly: bool = False
    anomaly_details: Optional[Dict[str, Any]] = None
    provider: str
    created_at: datetime
    input_history_count: int = 0

    class Config:
        from_attributes = True

class RecommendationItem(BaseModel):
    category: str      # "ĐIỆN", "NƯỚC", "THIẾT BỊ", "THÓI QUEN"
    title: str
    description: str
    priority: str      # "CAO", "TRUNG BÌNH", "THẤP"
    estimated_saving: Optional[str] = None

class AISavingsResponse(BaseModel):
    room_id: int
    room_code: str
    room_name: str
    overall_advice: str
    recommendations: List[RecommendationItem]
    provider: str
    generated_at: datetime

class AIStatusResponse(BaseModel):
    provider: str
    is_configured: bool
    model: str
    available_providers: List[str]
    message: str
