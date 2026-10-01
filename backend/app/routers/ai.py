import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.schemas.ai import (
    AIAnalyzeRequest,
    AIAnalyzeResponse,
    AISavingsRequest,
    AISavingsResponse,
    AIStatusResponse
)
from backend.app.services.ai_service import AIService
from backend.app.utils.security import get_current_user, check_room_access

router = APIRouter(prefix="/api/ai", tags=["AI Analysis & Recommendations"])

@router.get("/status", response_model=AIStatusResponse)
def get_ai_status(current_user: User = Depends(get_current_user)):
    """Kiểm tra trạng thái cấu hình dịch vụ AI"""
    return AIService.get_status()

@router.post("/analyze", response_model=AIAnalyzeResponse)
def analyze_consumption(
    data: AIAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    UC010: Phân tích mức tiêu thụ và cảnh báo bất thường (>30%) bằng AI
    - TC15: Phân tích khi đủ lịch sử (3-6 tháng)
    - TC16: Cảnh báo bất thường khi tăng >30%
    - TC18: Xử lý an toàn khi AI API gặp sự cố, tuyệt đối không hỏng dữ liệu gốc.
    """
    # Kiểm tra phân quyền truy cập phòng (TC13)
    check_room_access(current_user, data.room_id, db)
    return AIService.analyze_room_consumption(db, data.room_id, data.period)

@router.post("/savings", response_model=AISavingsResponse)
def get_savings_recommendations(
    data: AISavingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    UC011: AI Gợi ý tiết kiệm điện nước (TC17)
    - Đưa ra các khuyến nghị tham khảo thiết thực theo mức độ ưu tiên
    """
    check_room_access(current_user, data.room_id, db)
    return AIService.get_savings_recommendations(db, data.room_id)

@router.get("/history/{room_id}", response_model=list[AIAnalyzeResponse])
def get_room_ai_history(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lịch sử các lần phân tích AI của phòng"""
    room = check_room_access(current_user, room_id, db)
    analyses = db.query(AIAnalysis).filter(
        AIAnalysis.room_id == room_id
    ).order_by(AIAnalysis.created_at.desc()).limit(20).all()

    results = []
    for an in analyses:
        details = {}
        if an.anomaly_details:
            try:
                details = json.loads(an.anomaly_details)
            except Exception:
                details = {}

        results.append(AIAnalyzeResponse(
            id=an.id,
            room_id=an.room_id,
            room_code=room.room_code,
            room_name=room.name,
            period=an.period,
            summary=an.summary,
            alert=an.alert,
            recommendations=an.recommendations,
            is_anomaly=an.is_anomaly,
            anomaly_details=details,
            provider=an.provider,
            created_at=an.created_at,
            input_history_count=0
        ))
    return results
