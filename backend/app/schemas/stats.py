from pydantic import BaseModel
from typing import List, Optional

class MonthlyStatItem(BaseModel):
    period: str
    electricity_usage: float
    water_usage: float
    electricity_cost: float
    water_cost: float
    total_amount: float
    paid_amount: float
    debt_amount: float

class RoomUsageItem(BaseModel):
    room_id: int
    room_code: str
    room_name: str
    electricity_usage: float
    water_usage: float
    total_amount: float
    debt_amount: float

class AdminDashboardStats(BaseModel):
    total_rooms: int
    total_meters: int
    total_electricity_usage: float
    total_water_usage: float
    total_revenue: float
    total_debt: float
    unpaid_invoices_count: int
    paid_invoices_count: int
    anomalies_count: int
    monthly_stats: List[MonthlyStatItem]
    recent_anomalies: List[dict]

class UserDashboardStats(BaseModel):
    room_id: Optional[int] = None
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    current_debt: float
    latest_invoice: Optional[dict] = None
    consumption_history: List[MonthlyStatItem]
    latest_ai_analysis: Optional[dict] = None
