from typing import Tuple, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.price import PriceConfig
from backend.app.schemas.price import PriceConfigCreate, PriceConfigUpdate

class PriceService:
    @staticmethod
    def get_all(db: Session, service_type: str = None) -> list[PriceConfig]:
        query = db.query(PriceConfig)
        if service_type:
            query = query.filter(PriceConfig.service_type == service_type)
        return query.order_by(PriceConfig.service_type.asc(), PriceConfig.from_level.asc()).all()

    @staticmethod
    def get_by_id(db: Session, price_id: int) -> PriceConfig:
        config = db.query(PriceConfig).filter(PriceConfig.id == price_id).first()
        if not config:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy cấu hình đơn giá.")
        return config

    @staticmethod
    def create(db: Session, data: PriceConfigCreate) -> PriceConfig:
        if data.unit_price <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Đơn giá phải lớn hơn 0.")

        new_price = PriceConfig(
            service_type=data.service_type,
            pricing_type=data.pricing_type,
            tier_name=data.tier_name,
            from_level=data.from_level,
            to_level=data.to_level,
            unit_price=data.unit_price,
            effective_date=data.effective_date,
            expired_date=data.expired_date,
            is_active=data.is_active,
            description=data.description
        )
        db.add(new_price)
        db.commit()
        db.refresh(new_price)
        return new_price

    @staticmethod
    def update(db: Session, price_id: int, data: PriceConfigUpdate) -> PriceConfig:
        config = PriceService.get_by_id(db, price_id)
        if data.unit_price is not None:
            if data.unit_price <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Đơn giá phải lớn hơn 0.")
            config.unit_price = data.unit_price

        if data.tier_name is not None:
            config.tier_name = data.tier_name
        if data.from_level is not None:
            config.from_level = data.from_level
        if data.to_level is not None:
            config.to_level = data.to_level
        if data.effective_date is not None:
            config.effective_date = data.effective_date
        if data.expired_date is not None:
            config.expired_date = data.expired_date
        if data.is_active is not None:
            config.is_active = data.is_active
        if data.description is not None:
            config.description = data.description

        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def delete(db: Session, price_id: int) -> dict:
        config = PriceService.get_by_id(db, price_id)
        db.delete(config)
        db.commit()
        return {"message": "Đã xóa đơn giá thành công."}

    @staticmethod
    def calculate_cost(db: Session, service_type: str, usage: float) -> Tuple[float, List[Dict[str, Any]]]:
        """
        Tính tiền theo cấu hình đơn giá hiện hành (Bậc thang hoặc Cố định).
        Trả về (tổng tiền, danh sách chi tiết từng bậc).
        """
        if usage <= 0:
            return 0.0, []

        # Lấy tất cả cấu hình giá đang hoạt động cho loại dịch vụ này
        configs = db.query(PriceConfig).filter(
            PriceConfig.service_type == service_type,
            PriceConfig.is_active == True
        ).order_by(PriceConfig.from_level.asc()).all()

        if not configs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chưa thiết lập đơn giá cho dịch vụ {service_type}. Vui lòng cấu hình đơn giá trước khi lập hóa đơn."
            )

        # Kiểm tra nếu là giá cố định (chỉ có 1 bản ghi FIXED hoặc tất cả là FIXED)
        if any(c.pricing_type == "FIXED" for c in configs):
            fixed_cfg = next((c for c in configs if c.pricing_type == "FIXED"), configs[0])
            total_cost = usage * fixed_cfg.unit_price
            details = [{
                "tier_name": fixed_cfg.tier_name or "Đơn giá cố định",
                "from_level": fixed_cfg.from_level,
                "to_level": fixed_cfg.to_level,
                "unit_price": fixed_cfg.unit_price,
                "usage_in_tier": usage,
                "cost": total_cost
            }]
            return total_cost, details

        # Tính theo bậc thang (TIERED)
        total_cost = 0.0
        details = []
        remaining_usage = usage

        for cfg in configs:
            if remaining_usage <= 0:
                break

            tier_capacity = None
            if cfg.to_level is not None:
                tier_capacity = cfg.to_level - cfg.from_level

            if tier_capacity is not None:
                used_in_tier = min(remaining_usage, tier_capacity)
            else:
                used_in_tier = remaining_usage

            cost_in_tier = used_in_tier * cfg.unit_price
            total_cost += cost_in_tier
            remaining_usage -= used_in_tier

            details.append({
                "tier_name": cfg.tier_name or f"Bậc ({cfg.from_level} - {cfg.to_level if cfg.to_level else 'trở lên'})",
                "from_level": cfg.from_level,
                "to_level": cfg.to_level,
                "unit_price": cfg.unit_price,
                "usage_in_tier": used_in_tier,
                "cost": cost_in_tier
            })

        return total_cost, details
