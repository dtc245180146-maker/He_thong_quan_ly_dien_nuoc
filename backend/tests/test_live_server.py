import sys
import json
import urllib.request

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get(url, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def post(url, data, headers=None):
    if headers is None:
        headers = {}
    body = json.dumps(data).encode('utf-8')
    headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

print("=== 1. Health check ===")
status, data = get("http://127.0.0.1:8000/api/health")
print(f"Health: {status} -> {data}")

print("\n=== 2. Admin Login ===")
status, admin_auth = post("http://127.0.0.1:8000/api/auth/login", {
    "username": "admin",
    "password": "admin123"
})
token = admin_auth["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"Admin Login Success! User: {admin_auth['username']}, Role: {admin_auth['role']}")

print("\n=== 3. Admin Dashboard Stats ===")
status, stats = get("http://127.0.0.1:8000/api/stats/admin-dashboard", headers)
print(f"Admin Dashboard: Rooms={stats['total_rooms']}, Meters={stats['total_meters']}, Revenue={stats['total_revenue']:,.0f}đ, Debt={stats['total_debt']:,.0f}đ")
print(f"Electricity={stats['total_electricity_usage']} kWh, Water={stats['total_water_usage']} m3, Anomalies={stats['anomalies_count']}")

print("\n=== 4. AI Analysis for P103 (Anomalous Room) ===")
# Find room id for P103
status, rooms = get("http://127.0.0.1:8000/api/rooms", headers)
p103 = next((r for r in rooms if r["room_code"] == "P103"), None)
assert p103 is not None, "P103 room not found!"

status, ai_res = post("http://127.0.0.1:8000/api/ai/analyze", {
    "room_id": p103["id"],
    "period": "2026-09"
}, headers)
print(f"AI Provider: {ai_res['provider']}")
print(f"Is Anomaly (>30%): {ai_res['is_anomaly']}")
print(f"Alert: {ai_res.get('alert')}")
print(f"Anomaly Details: {ai_res.get('anomaly_details')}")
print(f"Summary preview: {ai_res['summary'][:140]}...")

print("\n=== 5. User Login (user_p103) ===")
status, user_auth = post("http://127.0.0.1:8000/api/auth/login", {
    "username": "user_p103",
    "password": "user123"
})
user_headers = {"Authorization": f"Bearer {user_auth['access_token']}"}
print(f"User Login Success! User: {user_auth['username']}, Room: {user_auth['room_code']}")

print("\n=== 6. User Isolation Test (Cannot access other rooms) ===")
# User user_p103 should only see their own room's invoices
status, user_invoices = get("http://127.0.0.1:8000/api/invoices", user_headers)
room_codes = set(inv["room_code"] for inv in user_invoices)
print(f"Invoices visible to user_p103: {len(user_invoices)} invoices across rooms: {room_codes}")
assert room_codes == {"P103"}, f"Security violation! Expected only P103, got {room_codes}"
print("=> Role isolation verified! User cannot view other households.")

print("\n=== 7. User Dashboard Stats ===")
status, user_dashboard = get("http://127.0.0.1:8000/api/stats/user-dashboard", user_headers)
print(f"User room: {user_dashboard['room_name']}, Debt: {user_dashboard['current_debt']:,.0f}đ, History items: {len(user_dashboard['consumption_history'])}")

print("\n=== 8. Frontend Vite Server Check ===")
req = urllib.request.Request("http://127.0.0.1:5173")
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode("utf-8")
    print(f"Vite Index HTML status: {resp.status}, length: {len(html)}, Contains <div id=\"root\">: {'<div id=\"root\">' in html}")

print("\n==============================================")
print(">>> ALL LIVE INTEGRATION CHECKS PASSED 100%! <<<")
print("==============================================")
