from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.price import PriceConfigCreate, PriceConfigUpdate, PriceConfigResponse
from backend.app.services.price_service import PriceService
from backend.app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/api/prices", tags=["Prices"])

@router.get("", response_model=list[PriceConfigResponse])
def get_prices(
    service_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """UC004: Xem danh mục đơn giá điện nước hiện hành"""
    return PriceService.get_all(db, service_type)

@router.get("/{price_id}", response_model=PriceConfigResponse)
def get_price(price_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Xem chi tiết một cấu hình đơn giá"""
    return PriceService.get_by_id(db, price_id)

@router.post("", response_model=PriceConfigResponse, status_code=status.HTTP_201_CREATED)
def create_price(data: PriceConfigCreate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Thiết lập đơn giá mới (UC004, TC06)"""
    return PriceService.create(db, data)

@router.put("/{price_id}", response_model=PriceConfigResponse)
def update_price(price_id: int, data: PriceConfigUpdate, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Cập nhật đơn giá"""
    return PriceService.update(db, price_id, data)

@router.delete("/{price_id}")
def delete_price(price_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: Xóa đơn giá"""
    return PriceService.delete(db, price_id)
