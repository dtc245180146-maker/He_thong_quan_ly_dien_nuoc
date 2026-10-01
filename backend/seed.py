import sys
from pathlib import Path

# Đảm bảo stdout hỗ trợ UTF-8 trên Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Thêm đường dẫn project vào sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.database import engine, Base, SessionLocal
from backend.app.utils.seed_data import seed_database
import backend.app.models # Đảm bảo nạp đầy đủ các models

def main():
    print("Đang tạo các bảng trong cơ sở dữ liệu nếu chưa có...")
    Base.metadata.create_all(bind=engine)
    print("Tạo bảng thành công.")

    print("Đang nạp dữ liệu mẫu (Seed Data)...")
    db = SessionLocal()
    try:
        result = seed_database(db)
        print(f"Kết quả: {result['message']}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
