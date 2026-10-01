from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.room import Room
from backend.app.models.meter import Meter
from backend.app.models.reading import MeterReading
from backend.app.models.invoice import Invoice
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.schemas.stats import AdminDashboardStats, UserDashboardStats, MonthlyStatItem

class StatsService:
    @staticmethod
    def get_admin_dashboard(db: Session) -> AdminDashboardStats:
        total_rooms = db.query(func.count(Room.id)).scalar() or 0
        total_meters = db.query(func.count(Meter.id)).scalar() or 0

        # Tổng hợp từ invoices
        invoices = db.query(Invoice).all()
        total_elec = sum(inv.electricity_usage for inv in invoices)
        total_water = sum(inv.water_usage for inv in invoices)
        total_revenue = sum(inv.paid_amount for inv in invoices)
        total_debt = sum(inv.remaining_amount for inv in invoices)
        unpaid_count = sum(1 for inv in invoices if inv.status in ("UNPAID", "PARTIALLY_PAID"))
        paid_count = sum(1 for inv in invoices if inv.status == "PAID")

        # Thống kê theo từng tháng (period)
        period_data = defaultdict(lambda: {
            "electricity_usage": 0.0,
            "water_usage": 0.0,
            "electricity_cost": 0.0,
            "water_cost": 0.0,
            "total_amount": 0.0,
            "paid_amount": 0.0,
            "debt_amount": 0.0
        })

        for inv in invoices:
            p = inv.period
            period_data[p]["electricity_usage"] += inv.electricity_usage
            period_data[p]["water_usage"] += inv.water_usage
            period_data[p]["electricity_cost"] += inv.electricity_cost
            period_data[p]["water_cost"] += inv.water_cost
            period_data[p]["total_amount"] += inv.total_amount
            period_data[p]["paid_amount"] += inv.paid_amount
            period_data[p]["debt_amount"] += inv.remaining_amount

        # Sắp xếp theo kỳ tăng dần (cho biểu đồ dòng thời gian)
        sorted_periods = sorted(period_data.keys())
        monthly_stats = [
            MonthlyStatItem(
                period=p,
                electricity_usage=round(period_data[p]["electricity_usage"], 1),
                water_usage=round(period_data[p]["water_usage"], 1),
                electricity_cost=round(period_data[p]["electricity_cost"], 0),
                water_cost=round(period_data[p]["water_cost"], 0),
                total_amount=round(period_data[p]["total_amount"], 0),
                paid_amount=round(period_data[p]["paid_amount"], 0),
                debt_amount=round(period_data[p]["debt_amount"], 0),
            )
            for p in sorted_periods
        ]

        # Cảnh báo bất thường gần đây
        recent_anomalies_query = db.query(AIAnalysis).filter(
            AIAnalysis.is_anomaly == True
        ).order_by(AIAnalysis.created_at.desc()).limit(10).all()

        recent_anomalies = []
        for an in recent_anomalies_query:
            room = db.query(Room).filter(Room.id == an.room_id).first()
            recent_anomalies.append({
                "id": an.id,
                "room_id": an.room_id,
                "room_code": room.room_code if room else f"Phòng #{an.room_id}",
                "period": an.period,
                "alert": an.alert,
                "created_at": an.created_at.isoformat()
            })

        anomalies_count = len(recent_anomalies)

        return AdminDashboardStats(
            total_rooms=total_rooms,
            total_meters=total_meters,
            total_electricity_usage=round(total_elec, 1),
            total_water_usage=round(total_water, 1),
            total_revenue=round(total_revenue, 0),
            total_debt=round(total_debt, 0),
            unpaid_invoices_count=unpaid_count,
            paid_invoices_count=paid_count,
            anomalies_count=anomalies_count,
            monthly_stats=monthly_stats,
            recent_anomalies=recent_anomalies
        )

    @staticmethod
    def get_user_dashboard(db: Session, user_id: int) -> UserDashboardStats:
        user_room = db.query(Room).filter(Room.user_id == user_id).first()
        if not user_room:
            return UserDashboardStats(
                room_id=None,
                room_code=None,
                room_name=None,
                current_debt=0.0,
                latest_invoice=None,
                consumption_history=[],
                latest_ai_analysis=None
            )

        invoices = db.query(Invoice).filter(
            Invoice.room_id == user_room.id
        ).order_by(Invoice.period.asc()).all()

        current_debt = sum(inv.remaining_amount for inv in invoices)

        monthly_history = [
            MonthlyStatItem(
                period=inv.period,
                electricity_usage=round(inv.electricity_usage, 1),
                water_usage=round(inv.water_usage, 1),
                electricity_cost=round(inv.electricity_cost, 0),
                water_cost=round(inv.water_cost, 0),
                total_amount=round(inv.total_amount, 0),
                paid_amount=round(inv.paid_amount, 0),
                debt_amount=round(inv.remaining_amount, 0)
            )
            for inv in invoices
        ]

        latest_inv = invoices[-1] if invoices else None
        latest_inv_dict = None
        if latest_inv:
            latest_inv_dict = {
                "id": latest_inv.id,
                "invoice_code": latest_inv.invoice_code,
                "period": latest_inv.period,
                "issue_date": latest_inv.issue_date.isoformat(),
                "total_amount": latest_inv.total_amount,
                "paid_amount": latest_inv.paid_amount,
                "remaining_amount": latest_inv.remaining_amount,
                "status": latest_inv.status
            }

        latest_ai = db.query(AIAnalysis).filter(
            AIAnalysis.room_id == user_room.id
        ).order_by(AIAnalysis.created_at.desc()).first()

        latest_ai_dict = None
        if latest_ai:
            latest_ai_dict = {
                "id": latest_ai.id,
                "period": latest_ai.period,
                "summary": latest_ai.summary,
                "alert": latest_ai.alert,
                "recommendations": latest_ai.recommendations,
                "is_anomaly": latest_ai.is_anomaly,
                "created_at": latest_ai.created_at.isoformat()
            }

        return UserDashboardStats(
            room_id=user_room.id,
            room_code=user_room.room_code,
            room_name=user_room.name,
            current_debt=round(current_debt, 0),
            latest_invoice=latest_inv_dict,
            consumption_history=monthly_history,
            latest_ai_analysis=latest_ai_dict
        )
