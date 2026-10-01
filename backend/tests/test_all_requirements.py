import pytest
from fastapi.testclient import TestClient

def test_tc01_login_success(client: TestClient):
    """TC01: Đăng nhập thành công với tài khoản Admin và User"""
    # Admin login
    res_admin = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert "access_token" in data_admin
    assert data_admin["role"] == "ADMIN"

    # User login
    res_user = client.post("/api/auth/login", json={"username": "user_p101", "password": "user123"})
    assert res_user.status_code == 200
    data_user = res_user.json()
    assert "access_token" in data_user
    assert data_user["role"] == "USER"
    assert data_user["room_code"] == "P101"

def test_tc02_login_wrong_password(client: TestClient):
    """TC02: Đăng nhập thất bại khi sai mật khẩu"""
    res = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401
    assert "Tên đăng nhập hoặc mật khẩu không chính xác" in res.json()["detail"]

def test_tc03_create_room_valid(client: TestClient, admin_headers):
    """TC03: Quản lý hộ/phòng - Thêm phòng hợp lệ"""
    payload = {
        "room_code": "P201",
        "name": "Phòng 201 (Tầng 2)",
        "address": "Tòa nhà Xanh",
        "resident_count": 2,
        "phone": "0987654321",
        "is_active": True
    }
    res = client.post("/api/rooms", json=payload, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["room_code"] == "P201"
    assert data["resident_count"] == 2

def test_tc04_create_room_duplicate(client: TestClient, admin_headers):
    """TC04: Quản lý hộ/phòng - Trùng mã phòng phải bị từ chối"""
    payload = {
        "room_code": "P101", # Đã tồn tại
        "name": "Phòng 101 trùng",
        "resident_count": 1
    }
    res = client.post("/api/rooms", json=payload, headers=admin_headers)
    assert res.status_code == 400
    assert "đã tồn tại" in res.json()["detail"]

def test_tc05_create_meter(client: TestClient, admin_headers):
    """TC05: Thêm và liên kết đồng hồ với phòng"""
    payload = {
        "meter_code": "EM-P201",
        "meter_type": "ELECTRICITY",
        "unit": "kWh",
        "room_id": 1,
        "is_active": True,
        "notes": "Đồng hồ lắp mới"
    }
    res = client.post("/api/meters", json=payload, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["meter_code"] == "EM-P201"

def test_tc06_set_prices(client: TestClient, admin_headers):
    """TC06: Thiết lập đơn giá hợp lệ (> 0)"""
    payload = {
        "service_type": "ELECTRICITY",
        "pricing_type": "FIXED",
        "tier_name": "Đơn giá cố định dịch vụ",
        "from_level": 0.0,
        "to_level": None,
        "unit_price": 3500.0,
        "description": "Giá cố định theo thỏa thuận"
    }
    res = client.post("/api/prices", json=payload, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["unit_price"] == 3500.0

    # Kiểm tra đơn giá <= 0 phải bị từ chối
    bad_payload = payload.copy()
    bad_payload["unit_price"] = 0
    res_bad = client.post("/api/prices", json=bad_payload, headers=admin_headers)
    assert res_bad.status_code == 422 # Pydantic gt=0.0 validation

def test_tc07_enter_valid_readings(client: TestClient, admin_headers):
    """TC07: Nhập chỉ số hợp lệ (chỉ số mới >= cũ) và tính lượng tiêu thụ"""
    payload = {
        "meter_id": 1,
        "room_id": 1,
        "period": "2026-10",
        "old_reading": 1700.0,
        "new_reading": 1850.0,
        "notes": "Ghi chỉ số tháng 10"
    }
    res = client.post("/api/readings", json=payload, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["consumption"] == 150.0 # 1850 - 1700

def test_tc08_enter_invalid_readings(client: TestClient, admin_headers):
    """TC08: Chỉ số mới nhỏ hơn cũ hoặc âm phải bị từ chối"""
    # Chỉ số mới < chỉ số cũ
    payload_smaller = {
        "meter_id": 1,
        "room_id": 1,
        "period": "2026-11",
        "old_reading": 1850.0,
        "new_reading": 1800.0
    }
    res1 = client.post("/api/readings", json=payload_smaller, headers=admin_headers)
    assert res1.status_code in (400, 422)

    # Chỉ số âm
    payload_neg = {
        "meter_id": 1,
        "room_id": 1,
        "period": "2026-12",
        "old_reading": -10.0,
        "new_reading": 50.0
    }
    res2 = client.post("/api/readings", json=payload_neg, headers=admin_headers)
    assert res2.status_code in (400, 422)

def test_tc09_create_invoice(client: TestClient, admin_headers):
    """TC09: Lập hóa đơn khi có đủ chỉ số và đơn giá"""
    # Tạo thêm chỉ số nước cho kỳ 2026-10 của phòng 1
    client.post("/api/readings", json={
        "meter_id": 2, # Nước phòng 1
        "room_id": 1,
        "period": "2026-10",
        "old_reading": 260.0,
        "new_reading": 272.0
    }, headers=admin_headers)

    payload = {
        "room_id": 1,
        "period": "2026-10",
        "other_fees": 50000.0,
        "notes": "Hóa đơn tháng 10"
    }
    res = client.post("/api/invoices", json=payload, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["electricity_usage"] == 150.0
    assert data["water_usage"] == 12.0
    assert data["total_amount"] > 0
    assert data["status"] == "UNPAID"

def test_tc10_duplicate_invoice_rejected(client: TestClient, admin_headers):
    """TC10: Không tạo trùng hóa đơn cùng phòng và cùng kỳ"""
    payload = {
        "room_id": 1,
        "period": "2026-10"
    }
    res = client.post("/api/invoices", json=payload, headers=admin_headers)
    assert res.status_code == 400
    assert "đã tồn tại" in res.json()["detail"]

def test_tc11_payment_process(client: TestClient, admin_headers):
    """TC11: Thanh toán và cập nhật công nợ"""
    # Lấy danh sách hóa đơn để tìm hóa đơn chưa thanh toán
    invoices = client.get("/api/invoices?status_filter=UNPAID", headers=admin_headers).json()
    assert len(invoices) > 0
    target_inv = invoices[0]

    pay_amount = min(100000.0, target_inv["remaining_amount"])
    payment_payload = {
        "invoice_id": target_inv["id"],
        "amount": pay_amount,
        "payment_method": "CHUYỂN KHOẢN",
        "notes": "Thanh toán qua app"
    }
    res = client.post("/api/payments", json=payment_payload, headers=admin_headers)
    assert res.status_code == 201

    # Kiểm tra lại hóa đơn xem đã cập nhật paid_amount chưa
    updated_inv = client.get(f"/api/invoices/{target_inv['id']}", headers=admin_headers).json()
    assert updated_inv["paid_amount"] == pay_amount
    assert updated_inv["remaining_amount"] == target_inv["total_amount"] - pay_amount

def test_tc12_user_view_own_data(client: TestClient, user_headers):
    """TC12: User xem được đúng dữ liệu hóa đơn và lịch sử của phòng mình"""
    res = client.get("/api/invoices", headers=user_headers)
    assert res.status_code == 200
    invoices = res.json()
    for inv in invoices:
        assert inv["room_code"] == "P101"

def test_tc13_user_forbidden_other_room(client: TestClient, user_headers):
    """TC13: User truy cập dữ liệu của phòng khác bị từ chối 403 Forbidden"""
    # Phòng 2 (P102) không thuộc về user_p101
    res = client.get("/api/rooms/2", headers=user_headers)
    assert res.status_code == 403
    assert "Bạn không có quyền truy cập dữ liệu của hộ/phòng khác" in res.json()["detail"]

def test_tc14_statistics(client: TestClient, admin_headers):
    """TC14: Xem thống kê tiêu thụ, doanh thu và công nợ"""
    res = client.get("/api/stats/admin-dashboard", headers=admin_headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_rooms"] >= 4
    assert stats["total_revenue"] > 0
    assert len(stats["monthly_stats"]) > 0

def test_tc15_ai_analysis_with_history(client: TestClient, admin_headers):
    """TC15: AI phân tích khi có đủ dữ liệu lịch sử"""
    payload = {"room_id": 1, "period": "2026-09"}
    res = client.post("/api/ai/analyze", json=payload, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert len(data["summary"]) > 0
    assert data["room_code"] == "P101"

def test_tc16_ai_anomaly_detection_above_30_percent(client: TestClient, admin_headers):
    """TC16: Cảnh báo bất thường khi mức tiêu thụ tăng trên 30% (Phòng P103 kỳ 2026-09)"""
    payload = {"room_id": 3, "period": "2026-09"}
    res = client.post("/api/ai/analyze", json=payload, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_anomaly"] is True
    assert "CẢNH BÁO BẤT THƯỜNG (>30%)" in data["alert"]
    assert "2026-09" in data["alert"]

def test_tc17_ai_savings_recommendations(client: TestClient, user_headers):
    """TC17: AI sinh các gợi ý tiết kiệm theo dữ liệu, không sửa dữ liệu gốc"""
    payload = {"room_id": 1}
    res = client.post("/api/ai/savings", json=payload, headers=user_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) >= 2
    assert "overall_advice" in data

def test_tc18_ai_error_handling_preserves_data(client: TestClient, admin_headers):
    """TC18: Hệ thống xử lý an toàn khi thiếu dữ liệu hoặc lỗi AI, bảo toàn dữ liệu gốc"""
    # Tạo 1 phòng mới tinh chưa có chỉ số nào
    new_room = client.post("/api/rooms", json={
        "room_code": "P999",
        "name": "Phòng thử nghiệm",
        "resident_count": 1
    }, headers=admin_headers).json()

    # Gọi AI phân tích cho phòng chưa đủ dữ liệu
    res = client.post("/api/ai/analyze", json={"room_id": new_room["id"]}, headers=admin_headers)
    assert res.status_code == 400
    assert "chưa có đủ dữ liệu" in res.json()["detail"]
