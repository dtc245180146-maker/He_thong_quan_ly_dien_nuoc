import json
import logging
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.config import settings
from backend.app.models.room import Room
from backend.app.models.reading import MeterReading
from backend.app.models.meter import Meter
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.schemas.ai import (
    AIAnalyzeResponse,
    AISavingsResponse,
    RecommendationItem,
    AIStatusResponse
)

logger = logging.getLogger(__name__)

class AIService:
    @staticmethod
    def get_status() -> AIStatusResponse:
        configured = False
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            configured = True
        elif settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            configured = True
        elif settings.AI_PROVIDER == "ollama":
            configured = True
        elif settings.AI_PROVIDER == "mock":
            configured = True

        msg = f"Đang sử dụng nhà cung cấp AI: {settings.AI_PROVIDER.upper()}."
        if not configured:
            msg += " (Chưa cấu hình API Key, có thể sử dụng chế độ Mock hoặc cấu hình trong file .env)."

        return AIStatusResponse(
            provider=settings.AI_PROVIDER,
            is_configured=configured,
            model=settings.GEMINI_MODEL if settings.AI_PROVIDER == "gemini" else (
                settings.OPENAI_MODEL if settings.AI_PROVIDER == "openai" else settings.OLLAMA_MODEL
            ),
            available_providers=["mock", "gemini", "openai", "ollama"],
            message=msg
        )

    @staticmethod
    def _call_gemini_api(system_prompt: str, user_prompt: str) -> str:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY chưa được cấu hình trong .env.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }
        with httpx.Client(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = client.post(url, json=payload)
            if resp.status_code != 200:
                raise Exception(f"Gemini API returned status {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    @staticmethod
    def _call_openai_api(system_prompt: str, user_prompt: str) -> str:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY chưa được cấu hình trong .env.")

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }
        with httpx.Client(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise Exception(f"OpenAI API returned status {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    @staticmethod
    def _call_ollama_api(system_prompt: str, user_prompt: str) -> str:
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False
        }
        with httpx.Client(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            resp = client.post(url, json=payload)
            if resp.status_code != 200:
                raise Exception(f"Ollama returned status {resp.status_code}: {resp.text}")
            data = resp.json()
            return data.get("response", "")

    @staticmethod
    def analyze_room_consumption(db: Session, room_id: int, target_period: str = None) -> AIAnalyzeResponse:
        """
        UC010: Phân tích và cảnh báo bằng AI
        - Quy tắc nghiệp vụ bắt buộc: Nếu mức tiêu thụ tăng trên 30% so với kỳ trước => cảnh báo bất thường.
        - Giới hạn dữ liệu: 3-6 tháng gần nhất.
        - AI chỉ phân tích từ dữ liệu cung cấp, không tự tạo số liệu.
        - Không làm thay đổi dữ liệu gốc.
        """
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hộ/phòng này.")

        # Lấy lịch sử chỉ số của phòng này
        readings = db.query(MeterReading).join(Meter).filter(
            MeterReading.room_id == room_id
        ).order_by(MeterReading.period.asc()).all()

        # Nhóm theo period
        history_by_period = {}
        for r in readings:
            p = r.period
            if p not in history_by_period:
                history_by_period[p] = {"electricity": 0.0, "water": 0.0}
            if r.meter.meter_type == "ELECTRICITY":
                history_by_period[p]["electricity"] += r.consumption
            elif r.meter.meter_type == "WATER":
                history_by_period[p]["water"] += r.consumption

        sorted_periods = sorted(history_by_period.keys())

        # TC15/A1: Kiểm tra đủ dữ liệu
        if len(sorted_periods) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phòng {room.room_code} hiện chưa có đủ dữ liệu lịch sử tiêu thụ (cần tối thiểu 2 kỳ ghi) để phân tích xu hướng và so sánh bất thường."
            )

        # Xác định kỳ cần phân tích
        if not target_period or target_period not in history_by_period:
            target_period = sorted_periods[-1]

        target_idx = sorted_periods.index(target_period)
        if target_idx == 0:
            # Nếu là kỳ đầu tiên nhất, không có kỳ trước để so sánh
            prev_period = None
        else:
            prev_period = sorted_periods[target_idx - 1]

        curr_data = history_by_period[target_period]
        curr_elec = curr_data["electricity"]
        curr_water = curr_data["water"]

        prev_elec = history_by_period[prev_period]["electricity"] if prev_period else 0.0
        prev_water = history_by_period[prev_period]["water"] if prev_period else 0.0

        # Logic nghiệp vụ xác định tăng > 30% (TC16, Rule AI02)
        elec_diff_pct = 0.0
        water_diff_pct = 0.0
        is_anomaly = False
        anomaly_reasons = []

        if prev_period:
            if prev_elec > 0:
                elec_diff_pct = ((curr_elec - prev_elec) / prev_elec) * 100
                if elec_diff_pct > 30.0:
                    is_anomaly = True
                    anomaly_reasons.append(
                        f"Lượng điện tiêu thụ kỳ {target_period} ({curr_elec:.1f} kWh) tăng {elec_diff_pct:.1f}% so với kỳ trước {prev_period} ({prev_elec:.1f} kWh), vượt ngưỡng an toàn 30%."
                    )
            elif curr_elec > 50:
                is_anomaly = True
                anomaly_reasons.append(f"Điện tiêu thụ tăng đột biến từ 0 lên {curr_elec:.1f} kWh.")

            if prev_water > 0:
                water_diff_pct = ((curr_water - prev_water) / prev_water) * 100
                if water_diff_pct > 30.0:
                    is_anomaly = True
                    anomaly_reasons.append(
                        f"Lượng nước tiêu thụ kỳ {target_period} ({curr_water:.1f} m³) tăng {water_diff_pct:.1f}% so với kỳ trước {prev_period} ({prev_water:.1f} m³), vượt ngưỡng an toàn 30%."
                    )
            elif curr_water > 10:
                is_anomaly = True
                anomaly_reasons.append(f"Nước tiêu thụ tăng đột biến từ 0 lên {curr_water:.1f} m³.")

        # Lấy tối đa 6 tháng gần nhất cho prompt
        recent_periods = sorted_periods[-6:]
        usage_text_lines = []
        for p in recent_periods:
            ed = history_by_period[p]["electricity"]
            wd = history_by_period[p]["water"]
            usage_text_lines.append(f"- Kỳ {p}: Điện {ed:.1f} kWh, Nước {wd:.1f} m³")

        utility_usage_formatted = "\n".join(usage_text_lines)

        # Mẫu Prompt chuẩn theo tài liệu
        system_prompt = (
            "Bạn là trợ lý phân tích hóa đơn điện nước chuyên nghiệp.\n"
            "Chỉ nhận xét từ dữ liệu được cung cấp, không tự tạo số liệu."
        )
        user_prompt = (
            f"Lịch sử tiêu thụ {room.name} (Mã: {room.room_code}):\n"
            f"{utility_usage_formatted}\n\n"
            f"Kỳ đang kiểm tra: {target_period} (So với kỳ liền trước {prev_period}).\n"
            f"Hãy tóm tắt biến động và chỉ ra tháng cần kiểm tra."
        )

        ai_summary = ""
        ai_alert = ""
        provider_used = settings.AI_PROVIDER

        # Gọi AI API (Gemini / OpenAI / Ollama) hoặc Mock
        try:
            if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
                ai_text = AIService._call_gemini_api(system_prompt, user_prompt)
                ai_summary = ai_text.strip()
            elif settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
                ai_text = AIService._call_openai_api(system_prompt, user_prompt)
                ai_summary = ai_text.strip()
            elif settings.AI_PROVIDER == "ollama":
                ai_text = AIService._call_ollama_api(system_prompt, user_prompt)
                ai_summary = ai_text.strip()
            else:
                # Mock Heuristic AI: Tạo nhận xét chính xác dựa trên số liệu thực tế
                provider_used = "mock"
                elec_trend = "tăng" if elec_diff_pct > 5 else ("giảm" if elec_diff_pct < -5 else "ổn định")
                water_trend = "tăng" if water_diff_pct > 5 else ("giảm" if water_diff_pct < -5 else "ổn định")

                ai_summary = (
                    f"Dựa trên dữ liệu {len(recent_periods)} kỳ gần nhất của {room.name}: "
                    f"Trong kỳ {target_period}, mức tiêu thụ điện là {curr_elec:.1f} kWh (xu hướng {elec_trend}, {elec_diff_pct:+.1f}%), "
                    f"lượng nước tiêu thụ là {curr_water:.1f} m³ (xu hướng {water_trend}, {water_diff_pct:+.1f}%). "
                )
                if is_anomaly:
                    ai_summary += (
                        f"Tháng cần kiểm tra đặc biệt: {target_period}. "
                        "Có sự tăng đột biến về lượng điện/nước sử dụng so với tháng trước."
                    )
                else:
                    ai_summary += (
                        "Mức tiêu thụ nằm trong giới hạn biến động thông thường của hộ gia đình."
                    )
        except Exception as e:
            logger.warning(f"AI API error: {e}. Falling back to rule-based summary without corrupting data.")
            provider_used = "mock (fallback)"
            ai_summary = (
                f"Phân tích dữ liệu kỳ {target_period}: Điện {curr_elec:.1f} kWh, Nước {curr_water:.1f} m³. "
                f"(Lưu ý: Dịch vụ AI bên ngoài gặp sự cố, hệ thống tự động bảo toàn dữ liệu và tạo báo cáo chuẩn)."
            )

        # Cảnh báo dựa trên quy tắc >30%
        if is_anomaly:
            ai_alert = "CẢNH BÁO BẤT THƯỜNG (>30%):\n" + "\n".join(anomaly_reasons)
            ai_alert += f"\nKhuyến nghị: Kiểm tra ngay các thiết bị tiêu thụ lớn và đường ống nước trong tháng {target_period}."
        else:
            ai_alert = f"Mức tiêu thụ kỳ {target_period} bình thường, không phát hiện dấu hiệu tăng bất thường trên 30%."

        # Gợi ý ngắn gọn
        ai_recommendations = (
            f"1. Theo dõi sát chỉ số điện nước trong kỳ kế tiếp.\n"
            f"2. Kiểm tra tắt các thiết bị điện khi không sử dụng.\n"
            f"3. Kiểm tra van phao bồn cầu và vòi xả nước để chống rò rỉ âm thầm."
        )

        anomaly_dict = {
            "is_anomaly": is_anomaly,
            "target_period": target_period,
            "prev_period": prev_period,
            "elec_curr": curr_elec,
            "elec_prev": prev_elec,
            "elec_diff_pct": round(elec_diff_pct, 1),
            "water_curr": curr_water,
            "water_prev": prev_water,
            "water_diff_pct": round(water_diff_pct, 1),
            "reasons": anomaly_reasons
        }

        # Lưu kết quả phân tích vào Database (đảm bảo không ghi đè hoặc thay đổi số liệu gốc!)
        analysis_record = AIAnalysis(
            room_id=room_id,
            period=target_period,
            analysis_type="COMPREHENSIVE",
            input_data=json.dumps(history_by_period, ensure_ascii=False),
            summary=ai_summary,
            alert=ai_alert,
            recommendations=ai_recommendations,
            is_anomaly=is_anomaly,
            anomaly_details=json.dumps(anomaly_dict, ensure_ascii=False),
            provider=provider_used,
            created_at=datetime.utcnow()
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

        return AIAnalyzeResponse(
            id=analysis_record.id,
            room_id=room.id,
            room_code=room.room_code,
            room_name=room.name,
            period=target_period,
            summary=ai_summary,
            alert=ai_alert,
            recommendations=ai_recommendations,
            is_anomaly=is_anomaly,
            anomaly_details=anomaly_dict,
            provider=provider_used,
            created_at=analysis_record.created_at,
            input_history_count=len(recent_periods)
        )

    @staticmethod
    def get_savings_recommendations(db: Session, room_id: int) -> AISavingsResponse:
        """
        UC011: AI Gợi ý tiết kiệm điện nước
        - Phân tích xu hướng và đưa ra các đề xuất cụ thể theo thứ tự ưu tiên.
        - Kết quả chỉ mang tính tham khảo.
        - Không làm thay đổi dữ liệu gốc.
        """
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hộ/phòng.")

        readings = db.query(MeterReading).join(Meter).filter(
            MeterReading.room_id == room_id
        ).order_by(MeterReading.period.desc()).limit(6).all()

        elec_usages = [r.consumption for r in readings if r.meter.meter_type == "ELECTRICITY"]
        water_usages = [r.consumption for r in readings if r.meter.meter_type == "WATER"]

        avg_elec = sum(elec_usages) / len(elec_usages) if elec_usages else 0.0
        avg_water = sum(water_usages) / len(water_usages) if water_usages else 0.0

        recommendations = []

        # 1. Đề xuất về điện
        if avg_elec > 150:
            recommendations.append(RecommendationItem(
                category="ĐIỆN",
                title="Tối ưu nhiệt độ điều hòa & thiết bị nhiệt",
                description=f"Mức tiêu thụ điện trung bình của phòng là {avg_elec:.1f} kWh/tháng. Nên cài đặt điều hòa ở mức 26-28°C kết hợp quạt gió và bảo dưỡng định kỳ lưới lọc 3 tháng/lần.",
                priority="CAO",
                estimated_saving="Tiết kiệm 15% - 25% điện năng"
            ))
        else:
            recommendations.append(RecommendationItem(
                category="ĐIỆN",
                title="Sử dụng thiết bị chiếu sáng LED & rút nguồn điện chờ",
                description="Tắt các thiết bị điện khi ra khỏi phòng và không để các thiết bị như ấm siêu tốc, sạc laptop ở chế độ cắm liên tục.",
                priority="TRUNG BÌNH",
                estimated_saving="Tiết kiệm 5% - 10% điện năng"
            ))

        # 2. Đề xuất về nước
        if avg_water > 12:
            recommendations.append(RecommendationItem(
                category="NƯỚC",
                title="Kiểm tra hệ thống van phao & chống rò rỉ bồn cầu",
                description=f"Lượng nước tiêu thụ trung bình {avg_water:.1f} m³/tháng khá cao so với quy chuẩn sinh hoạt. Cần kiểm tra ngay hiện tượng rỉ nước ngầm tại két bồn cầu hoặc khớp nối vòi sen.",
                priority="CAO",
                estimated_saving="Tiết kiệm 3 - 5 m³ nước/tháng"
            ))
        else:
            recommendations.append(RecommendationItem(
                category="NƯỚC",
                title="Lắp đầu vòi tăng áp tiết kiệm nước",
                description="Sử dụng đầu lọc tạo bọt cho vòi rửa chén và lavabo giúp giữ áp lực nước tốt nhưng giảm lượng nước thất thoát thực tế.",
                priority="TRUNG BÌNH",
                estimated_saving="Tiết kiệm 10% - 15% lượng nước"
            ))

        # 3. Đề xuất thói quen & giờ cao điểm
        recommendations.append(RecommendationItem(
            category="THÓI QUEN",
            title="Tránh bật đồng thời nhiều thiết bị công suất lớn",
            description="Không bật bình nóng lạnh, bàn ủi, bếp từ và điều hòa cùng một thời điểm trong khung giờ cao điểm (18h00 - 21h00) để tránh quá tải điện áp và tăng tiền điện theo bậc thang cao nhất.",
            priority="TRUNG BÌNH",
            estimated_saving="Giảm áp lực tiền điện bậc cao"
        ))

        overall_advice = (
            f"Dựa trên dữ liệu tiêu thụ trung bình ({avg_elec:.1f} kWh điện và {avg_water:.1f} m³ nước mỗi kỳ), "
            f"hệ thống khuyến nghị phòng {room.room_code} tập trung quản lý thiết bị nhiệt lạnh và kiểm tra chống rò rỉ nước. "
            "Các khuyến nghị trên mang tính chất hỗ trợ tham khảo nhằm giúp tối ưu chi phí sinh hoạt hàng tháng."
        )

        return AISavingsResponse(
            room_id=room.id,
            room_code=room.room_code,
            room_name=room.name,
            overall_advice=overall_advice,
            recommendations=recommendations,
            provider=settings.AI_PROVIDER,
            generated_at=datetime.utcnow()
        )
