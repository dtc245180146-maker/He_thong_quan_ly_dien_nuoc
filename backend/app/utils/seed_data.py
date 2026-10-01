import json
from datetime import date, datetime
from sqlalchemy.orm import Session
from backend.app.models.user import User
from backend.app.models.room import Room
from backend.app.models.meter import Meter
from backend.app.models.price import PriceConfig
from backend.app.models.reading import MeterReading
from backend.app.models.invoice import Invoice
from backend.app.models.payment import Payment
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.models.notification import Notification
from backend.app.utils.security import hash_password
from backend.app.services.price_service import PriceService

def seed_database(db: Session):
    """Khởi tạo toàn bộ dữ liệu mẫu ban đầu cho hệ thống"""

    # 1. KIỂM TRA ĐÃ CÓ ADMIN CHƯA
    admin_user = db.query(User).filter(User.username == "admin").first()
    if admin_user:
        return {"message": "Dữ liệu mẫu đã tồn tại trong CSDL, không cần tạo lại."}

    # 2. TẠO TÀI KHOẢN NGƯỜI DÙNG (Admin & User)
    admin = User(
        username="admin",
        hashed_password=hash_password("admin123"),
        full_name="Quản Trị Viên (Admin)",
        email="admin@diennuoc.local",
        phone="0901234567",
        role="ADMIN",
        is_active=True
    )
    user1 = User(
        username="user_p101",
        hashed_password=hash_password("user123"),
        full_name="Nguyễn Văn An",
        email="an.nguyen@gmail.com",
        phone="0912345678",
        role="USER",
        is_active=True
    )
    user2 = User(
        username="user_p102",
        hashed_password=hash_password("user123"),
        full_name="Trần Thị Bình",
        email="binh.tran@gmail.com",
        phone="0923456789",
        role="USER",
        is_active=True
    )
    user3 = User(
        username="user_p103",
        hashed_password=hash_password("user123"),
        full_name="Lê Hoàng Cường",
        email="cuong.le@gmail.com",
        phone="0934567890",
        role="USER",
        is_active=True
    )

    db.add_all([admin, user1, user2, user3])
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    db.refresh(user3)

    # 3. TẠO HỘ/PHÒNG
    room1 = Room(
        room_code="P101",
        name="Phòng 101 (Tầng 1)",
        address="Tòa nhà Xanh - Phòng 101",
        resident_count=2,
        phone="0912345678",
        is_active=True,
        user_id=user1.id
    )
    room2 = Room(
        room_code="P102",
        name="Phòng 102 (Tầng 1)",
        address="Tòa nhà Xanh - Phòng 102",
        resident_count=3,
        phone="0923456789",
        is_active=True,
        user_id=user2.id
    )
    room3 = Room(
        room_code="P103",
        name="Phòng 103 (Tầng 2)",
        address="Tòa nhà Xanh - Phòng 103",
        resident_count=1,
        phone="0934567890",
        is_active=True,
        user_id=user3.id
    )
    room4 = Room(
        room_code="P104",
        name="Phòng 104 (Tầng 2)",
        address="Tòa nhà Xanh - Phòng 104",
        resident_count=2,
        phone="0945678901",
        is_active=True,
        user_id=None
    )

    db.add_all([room1, room2, room3, room4])
    db.commit()
    for r in [room1, room2, room3, room4]:
        db.refresh(r)

    # 4. TẠO ĐỒNG HỒ ĐIỆN VÀ NƯỚC
    meters = []
    for r in [room1, room2, room3, room4]:
        # Đồng hồ điện
        m_elec = Meter(
            meter_code=f"EM-{r.room_code}",
            meter_type="ELECTRICITY",
            unit="kWh",
            room_id=r.id,
            installation_date=date(2026, 1, 1),
            is_active=True,
            notes=f"Đồng hồ điện tử {r.room_code}"
        )
        # Đồng hồ nước
        m_water = Meter(
            meter_code=f"WM-{r.room_code}",
            meter_type="WATER",
            unit="m³",
            room_id=r.id,
            installation_date=date(2026, 1, 1),
            is_active=True,
            notes=f"Đồng hồ nước cơ {r.room_code}"
        )
        meters.extend([m_elec, m_water])

    db.add_all(meters)
    db.commit()

    # 5. THIẾT LẬP CẤU HÌNH ĐƠN GIÁ (Bậc thang điện & nước theo quy định)
    prices = [
        # ĐIỆN SINH HOẠT THEO BẬC
        PriceConfig(
            service_type="ELECTRICITY",
            pricing_type="TIERED",
            tier_name="Bậc 1 (0 - 50 kWh)",
            from_level=0.0,
            to_level=50.0,
            unit_price=1893.0,
            effective_date=date(2026, 1, 1),
            description="Mức sinh hoạt cơ bản"
        ),
        PriceConfig(
            service_type="ELECTRICITY",
            pricing_type="TIERED",
            tier_name="Bậc 2 (51 - 100 kWh)",
            from_level=50.0,
            to_level=100.0,
            unit_price=1956.0,
            effective_date=date(2026, 1, 1),
            description="Mức sinh hoạt trung bình"
        ),
        PriceConfig(
            service_type="ELECTRICITY",
            pricing_type="TIERED",
            tier_name="Bậc 3 (101 - 200 kWh)",
            from_level=100.0,
            to_level=200.0,
            unit_price=2271.0,
            effective_date=date(2026, 1, 1),
            description="Mức sử dụng điều hòa"
        ),
        PriceConfig(
            service_type="ELECTRICITY",
            pricing_type="TIERED",
            tier_name="Bậc 4 (201 - 300 kWh)",
            from_level=200.0,
            to_level=300.0,
            unit_price=2860.0,
            effective_date=date(2026, 1, 1),
            description="Mức tiêu thụ cao"
        ),
        PriceConfig(
            service_type="ELECTRICITY",
            pricing_type="TIERED",
            tier_name="Bậc 5 (301 - 400 kWh)",
            from_level=300.0,
            to_level=400.0,
            unit_price=3197.0,
            effective_date=date(2026, 1, 1),
            description="Mức tiêu thụ rất cao"
        ),
        PriceConfig(
            service_type="ELECTRICITY",
            pricing_type="TIERED",
            tier_name="Bậc 6 (> 400 kWh)",
            from_level=400.0,
            to_level=None,
            unit_price=3302.0,
            effective_date=date(2026, 1, 1),
            description="Mức tiêu thụ cực cao"
        ),

        # NƯỚC SINH HOẠT THEO BẬC
        PriceConfig(
            service_type="WATER",
            pricing_type="TIERED",
            tier_name="Bậc 1 (0 - 10 m³)",
            from_level=0.0,
            to_level=10.0,
            unit_price=8500.0,
            effective_date=date(2026, 1, 1),
            description="Định mức nước cơ bản"
        ),
        PriceConfig(
            service_type="WATER",
            pricing_type="TIERED",
            tier_name="Bậc 2 (11 - 20 m³)",
            from_level=10.0,
            to_level=20.0,
            unit_price=9900.0,
            effective_date=date(2026, 1, 1),
            description="Định mức nước mở rộng"
        ),
        PriceConfig(
            service_type="WATER",
            pricing_type="TIERED",
            tier_name="Bậc 3 (21 - 30 m³)",
            from_level=20.0,
            to_level=30.0,
            unit_price=12000.0,
            effective_date=date(2026, 1, 1),
            description="Định mức nước cao"
        ),
        PriceConfig(
            service_type="WATER",
            pricing_type="TIERED",
            tier_name="Bậc 4 (> 30 m³)",
            from_level=30.0,
            to_level=None,
            unit_price=16000.0,
            effective_date=date(2026, 1, 1),
            description="Mức sử dụng nước nhiều"
        ),
    ]
    db.add_all(prices)
    db.commit()

    # 6. DỮ LIỆU LỊCH SỬ CHỈ SỐ QUA CÁC KỲ (2026-05 đến 2026-09)
    # Đặc biệt: Phòng P103 có mức tiêu thụ tăng vọt >30% ở kỳ 2026-09 để demo và test cảnh báo bất thường TC16!
    periods = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
    reading_plans = {
        # room_code: list of (elec_consumption, water_consumption) for each period
        "P101": [(120.0, 11.0), (135.0, 12.0), (140.0, 13.0), (130.0, 12.0), (145.0, 13.0)],
        "P102": [(180.0, 18.0), (195.0, 19.0), (210.0, 20.0), (205.0, 20.0), (220.0, 22.0)],
        # P103: tháng 8 là 85 kWh và 7.0 m³ -> tháng 9 tăng vọt lên 165 kWh (+94.1%) và 14.5 m³ (+107.1%) => TĂNG > 30%!
        "P103": [(75.0, 6.5), (80.0, 7.0), (82.0, 7.2), (85.0, 7.0), (165.0, 14.5)],
        "P104": [(110.0, 10.0), (115.0, 10.5), (120.0, 11.0), (125.0, 11.5), (130.0, 12.0)]
    }

    meters_dict = {}
    for m in db.query(Meter).all():
        meters_dict[(m.room_id, m.meter_type)] = m

    all_readings = []
    for r in [room1, room2, room3, room4]:
        elec_meter = meters_dict[(r.id, "ELECTRICITY")]
        water_meter = meters_dict[(r.id, "WATER")]

        elec_base = 1000.0
        water_base = 200.0

        for i, p in enumerate(periods):
            plan_elec, plan_water = reading_plans[r.room_code][i]

            # Bản ghi điện
            elec_new = elec_base + plan_elec
            mr_elec = MeterReading(
                meter_id=elec_meter.id,
                room_id=r.id,
                period=p,
                reading_date=date(2026, int(p.split("-")[1]), 25),
                old_reading=elec_base,
                new_reading=elec_new,
                consumption=plan_elec,
                notes=f"Kỳ ghi {p}"
            )
            elec_base = elec_new

            # Bản ghi nước
            water_new = water_base + plan_water
            mr_water = MeterReading(
                meter_id=water_meter.id,
                room_id=r.id,
                period=p,
                reading_date=date(2026, int(p.split("-")[1]), 25),
                old_reading=water_base,
                new_reading=water_new,
                consumption=plan_water,
                notes=f"Kỳ ghi {p}"
            )
            water_base = water_new

            all_readings.extend([mr_elec, mr_water])

    db.add_all(all_readings)
    db.commit()

    # 7. LẬP HÓA ĐƠN VÀ THANH TOÁN (Kỳ 2026-07 ĐÃ THANH TOÁN, 2026-08 CÒN NỢ, 2026-09 CHƯA THANH TOÁN)
    invoice_periods = ["2026-07", "2026-08", "2026-09"]
    for r in [room1, room2, room3, room4]:
        for inv_p in invoice_periods:
            # Lấy tiêu thụ
            readings = db.query(MeterReading).join(Meter).filter(
                MeterReading.room_id == r.id,
                MeterReading.period == inv_p
            ).all()

            e_reading = next((x for x in readings if x.meter.meter_type == "ELECTRICITY"), None)
            w_reading = next((x for x in readings if x.meter.meter_type == "WATER"), None)

            e_usage = e_reading.consumption if e_reading else 0.0
            w_usage = w_reading.consumption if w_reading else 0.0

            e_cost, e_details = PriceService.calculate_cost(db, "ELECTRICITY", e_usage)
            w_cost, w_details = PriceService.calculate_cost(db, "WATER", w_usage)

            total = round(e_cost + w_cost, 0)
            code = f"HD-{inv_p.replace('-', '')}-{r.room_code}"

            if inv_p == "2026-07":
                # Đã thanh toán đầy đủ
                inv = Invoice(
                    invoice_code=code,
                    room_id=r.id,
                    period=inv_p,
                    issue_date=date(2026, 7, 28),
                    due_date=date(2026, 8, 5),
                    electricity_usage=e_usage,
                    electricity_cost=round(e_cost, 0),
                    electricity_details=json.dumps(e_details, ensure_ascii=False),
                    water_usage=w_usage,
                    water_cost=round(w_cost, 0),
                    water_details=json.dumps(w_details, ensure_ascii=False),
                    other_fees=0.0,
                    total_amount=total,
                    paid_amount=total,
                    remaining_amount=0.0,
                    status="PAID",
                    notes="Đã thanh toán đúng hạn qua chuyển khoản"
                )
                db.add(inv)
                db.commit()
                db.refresh(inv)

                # Bản ghi thanh toán
                pm = Payment(
                    invoice_id=inv.id,
                    amount=total,
                    payment_date=datetime(2026, 8, 1, 10, 30),
                    payment_method="CHUYỂN KHOẢN",
                    transaction_code=f"MBB-{inv.invoice_code}",
                    status="COMPLETED",
                    notes="Thanh toán kỳ 07/2026"
                )
                db.add(pm)

            elif inv_p == "2026-08":
                # Một số phòng thanh toán 1 phần (Còn nợ)
                part_paid = round(total / 2, 0)
                inv = Invoice(
                    invoice_code=code,
                    room_id=r.id,
                    period=inv_p,
                    issue_date=date(2026, 8, 28),
                    due_date=date(2026, 9, 5),
                    electricity_usage=e_usage,
                    electricity_cost=round(e_cost, 0),
                    electricity_details=json.dumps(e_details, ensure_ascii=False),
                    water_usage=w_usage,
                    water_cost=round(w_cost, 0),
                    water_details=json.dumps(w_details, ensure_ascii=False),
                    other_fees=0.0,
                    total_amount=total,
                    paid_amount=part_paid,
                    remaining_amount=total - part_paid,
                    status="PARTIALLY_PAID",
                    notes="Thanh toán trước một phần tiền điện nước"
                )
                db.add(inv)
                db.commit()
                db.refresh(inv)

                pm = Payment(
                    invoice_id=inv.id,
                    amount=part_paid,
                    payment_date=datetime(2026, 9, 3, 15, 0),
                    payment_method="TIỀN MẶT",
                    transaction_code=None,
                    status="COMPLETED",
                    notes="Thanh toán trực tiếp tại văn phòng"
                )
                db.add(pm)

            else:
                # 2026-09: Chưa thanh toán
                inv = Invoice(
                    invoice_code=code,
                    room_id=r.id,
                    period=inv_p,
                    issue_date=date(2026, 9, 28),
                    due_date=date(2026, 10, 5),
                    electricity_usage=e_usage,
                    electricity_cost=round(e_cost, 0),
                    electricity_details=json.dumps(e_details, ensure_ascii=False),
                    water_usage=w_usage,
                    water_cost=round(w_cost, 0),
                    water_details=json.dumps(w_details, ensure_ascii=False),
                    other_fees=0.0,
                    total_amount=total,
                    paid_amount=0.0,
                    remaining_amount=total,
                    status="UNPAID",
                    notes="Hóa đơn kỳ mới phát hành"
                )
                db.add(inv)

    db.commit()

    # 8. TẠO CẢNH BÁO BẤT THƯỜNG & PHÂN TÍCH AI MẪU CHO P103 (>30% spike)
    ai_p103 = AIAnalysis(
        room_id=room3.id,
        period="2026-09",
        analysis_type="COMPREHENSIVE",
        input_data=json.dumps({
            "2026-07": {"electricity": 82.0, "water": 7.2},
            "2026-08": {"electricity": 85.0, "water": 7.0},
            "2026-09": {"electricity": 165.0, "water": 14.5}
        }, ensure_ascii=False),
        summary="Phân tích tiêu thụ phòng 103 (Lê Hoàng Cường): Tháng 2026-09 ghi nhận mức biến động rất lớn. Tiêu thụ điện tăng +94.1%, tiêu thụ nước tăng +107.1% so với tháng trước.",
        alert="CẢNH BÁO BẤT THƯỜNG (>30%):\n- Lượng điện tiêu thụ kỳ 2026-09 (165.0 kWh) tăng 94.1% so với kỳ trước 2026-08 (85.0 kWh), vượt xa ngưỡng an toàn 30%.\n- Lượng nước tiêu thụ kỳ 2026-09 (14.5 m³) tăng 107.1% so với kỳ trước 2026-08 (7.0 m³), vượt ngưỡng an toàn 30%.\nKhuyến nghị: Cần kiểm tra ngay thiết bị công suất lớn và rò rỉ đường nước.",
        recommendations="1. Kiểm tra hiện tượng hở phao bồn cầu hoặc rò rỉ âm tường.\n2. Kiểm tra điều hòa hoặc bình nóng lạnh có bị bật quên cả ngày hay không.\n3. Hạn chế sử dụng nhiều thiết bị công suất cao cùng lúc trong giờ cao điểm.",
        is_anomaly=True,
        anomaly_details=json.dumps({
            "is_anomaly": True,
            "target_period": "2026-09",
            "prev_period": "2026-08",
            "elec_curr": 165.0,
            "elec_prev": 85.0,
            "elec_diff_pct": 94.1,
            "water_curr": 14.5,
            "water_prev": 7.0,
            "water_diff_pct": 107.1
        }, ensure_ascii=False),
        provider="mock",
        created_at=datetime.utcnow()
    )
    db.add(ai_p103)

    # 9. TẠO THÔNG BÁO HỆ THỐNG
    notifs = [
        Notification(
            user_id=None,
            room_id=room3.id,
            title="Cảnh báo biến động tiêu thụ điện nước phòng 103",
            message="Phát hiện mức tiêu thụ điện (+94%) và nước (+107%) của phòng 103 trong kỳ 2026-09 tăng đột biến so với tháng trước. Vui lòng kiểm tra lại thiết bị.",
            type="ANOMALY",
            is_read=False,
            created_at=datetime.utcnow()
        ),
        Notification(
            user_id=user1.id,
            room_id=room1.id,
            title="Hóa đơn kỳ 2026-09 đã được phát hành",
            message="Hóa đơn tiền điện nước kỳ 2026-09 của phòng 101 đã được lập. Vui lòng thanh toán trước ngày 05/10/2026.",
            type="PAYMENT",
            is_read=False,
            created_at=datetime.utcnow()
        )
    ]
    db.add_all(notifs)
    db.commit()

    return {"message": "Đã khởi tạo thành công cơ sở dữ liệu và dữ liệu mẫu đầy đủ."}
