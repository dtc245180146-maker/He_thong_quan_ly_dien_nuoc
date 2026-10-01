from backend.app.schemas.auth import LoginRequest, TokenResponse, TokenPayload
from backend.app.schemas.user import UserBase, UserCreate, UserUpdate, UserResponse
from backend.app.schemas.room import RoomBase, RoomCreate, RoomUpdate, RoomResponse, RoomDetailResponse
from backend.app.schemas.meter import MeterBase, MeterCreate, MeterUpdate, MeterResponse
from backend.app.schemas.price import PriceConfigBase, PriceConfigCreate, PriceConfigUpdate, PriceConfigResponse
from backend.app.schemas.reading import MeterReadingBase, MeterReadingCreate, MeterReadingUpdate, MeterReadingResponse, QuickRoomReadingCreate
from backend.app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceDetailResponse
from backend.app.schemas.payment import PaymentCreate, PaymentResponse
from backend.app.schemas.stats import AdminDashboardStats, UserDashboardStats, MonthlyStatItem, RoomUsageItem
from backend.app.schemas.ai import AIAnalyzeRequest, AIAnalyzeResponse, AISavingsRequest, AISavingsResponse, AIStatusResponse
from backend.app.schemas.notification import NotificationBase, NotificationCreate, NotificationResponse

__all__ = [
    "LoginRequest", "TokenResponse", "TokenPayload",
    "UserBase", "UserCreate", "UserUpdate", "UserResponse",
    "RoomBase", "RoomCreate", "RoomUpdate", "RoomResponse", "RoomDetailResponse",
    "MeterBase", "MeterCreate", "MeterUpdate", "MeterResponse",
    "PriceConfigBase", "PriceConfigCreate", "PriceConfigUpdate", "PriceConfigResponse",
    "MeterReadingBase", "MeterReadingCreate", "MeterReadingUpdate", "MeterReadingResponse", "QuickRoomReadingCreate",
    "InvoiceCreate", "InvoiceResponse", "InvoiceDetailResponse",
    "PaymentCreate", "PaymentResponse",
    "AdminDashboardStats", "UserDashboardStats", "MonthlyStatItem", "RoomUsageItem",
    "AIAnalyzeRequest", "AIAnalyzeResponse", "AISavingsRequest", "AISavingsResponse", "AIStatusResponse",
    "NotificationBase", "NotificationCreate", "NotificationResponse",
]
