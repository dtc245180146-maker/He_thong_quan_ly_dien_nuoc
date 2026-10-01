from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.models.invoice import Invoice
from backend.app.schemas.stats import (
    AdminDashboardStats,
    UserDashboardStats,
    MonthlyStatItem,
    RoomUsageItem
)
from backend.app.services.stats_service import StatsService
from backend.app.utils.security import get_current_user, require_admin, check_room_access

router = APIRouter(prefix="/api/stats", tags=["Statistics"])

@router.get("/admin-dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """UC009: Dashboard thống kê toàn diện dành cho Quản lý / Chủ trọ"""
    return StatsService.get_admin_dashboard(db)

@router.get("/user-dashboard", response_model=UserDashboardStats)
def get_user_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """UC008: Dashboard dành cho Người thuê / Hộ gia đình"""
    return StatsService.get_user_dashboard(db, current_user.id)

@router.get("/history", response_model=list[MonthlyStatItem])
def get_consumption_history(
    room_id: int = None,
    from_period: str = None,
    to_period: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    UC008 / UC009: Tra cứu lịch sử tiêu thụ điện nước theo kỳ (Bảng & Biểu đồ)
    """
    if current_user.role != "ADMIN":
        user_room = db.query(Room).filter(Room.user_id == current_user.id).first()
        if not user_room:
            return []
        room_id = user_room.id
    elif room_id:
        check_room_access(current_user, room_id, db)

    query = db.query(Invoice)
    if room_id:
        query = query.filter(Invoice.room_id == room_id)
    if from_period:
        query = query.filter(Invoice.period >= from_period)
    if to_period:
        query = query.filter(Invoice.period <= to_period)

    invoices = query.order_by(Invoice.period.asc()).all()

    # Nhóm theo period nếu không lọc room_id, hoặc trả về theo từng kỳ
    history_dict = {}
    for inv in invoices:
        p = inv.period
        if p not in history_dict:
            history_dict[p] = {
                "period": p,
                "electricity_usage": 0.0,
                "water_usage": 0.0,
                "electricity_cost": 0.0,
                "water_cost": 0.0,
                "total_amount": 0.0,
                "paid_amount": 0.0,
                "debt_amount": 0.0
            }
        history_dict[p]["electricity_usage"] += inv.electricity_usage
        history_dict[p]["water_usage"] += inv.water_usage
        history_dict[p]["electricity_cost"] += inv.electricity_cost
        history_dict[p]["water_cost"] += inv.water_cost
        history_dict[p]["total_amount"] += inv.total_amount
        history_dict[p]["paid_amount"] += inv.paid_amount
        history_dict[p]["debt_amount"] += inv.remaining_amount

    return [
        MonthlyStatItem(
            period=p,
            electricity_usage=round(data["electricity_usage"], 1),
            water_usage=round(data["water_usage"], 1),
            electricity_cost=round(data["electricity_cost"], 0),
            water_cost=round(data["water_cost"], 0),
            total_amount=round(data["total_amount"], 0),
            paid_amount=round(data["paid_amount"], 0),
            debt_amount=round(data["debt_amount"], 0)
        )
        for p, data in sorted(history_dict.items())
    ]

@router.get("/rooms-summary", response_model=list[RoomUsageItem])
def get_rooms_summary(
    period: str = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin: Tổng hợp tiêu thụ và nợ theo từng phòng"""
    rooms = db.query(Room).all()
    results = []
    for r in rooms:
        query = db.query(Invoice).filter(Invoice.room_id == r.id)
        if period:
            query = query.filter(Invoice.period == period)
        invs = query.all()

        elec = sum(i.electricity_usage for i in invs)
        water = sum(i.water_usage for i in invs)
        total = sum(i.total_amount for i in invs)
        debt = sum(i.remaining_amount for i in invs)

        results.append(RoomUsageItem(
            room_id=r.id,
            room_code=r.room_code,
            room_name=r.name,
            electricity_usage=round(elec, 1),
            water_usage=round(water, 1),
            total_amount=round(total, 0),
            debt_amount=round(debt, 0)
        ))
    return results
