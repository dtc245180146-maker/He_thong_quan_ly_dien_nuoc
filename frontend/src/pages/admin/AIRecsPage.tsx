import React, { useEffect, useState } from 'react';
import { aiApi, roomsApi } from '../../api/client';
import { Room, AISavingsResponse } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Lightbulb, Sparkles, Zap, Droplets, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const AIRecsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<AISavingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0].id);
        fetchSavings(data[0].id);
      }
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải danh sách phòng.');
    }
  };

  const fetchSavings = async (roomId: number) => {
    setIsLoading(true);
    try {
      const data = await aiApi.getSavings(roomId);
      setRecommendations(data);
    } catch (e: any) {
      error(e.message || 'Không thể lấy gợi ý tiết kiệm từ AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoomChange = (roomId: number) => {
    setSelectedRoomId(roomId);
    fetchSavings(roomId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Lightbulb className="w-7 h-7 text-amber-500" />
            <span>AI Gợi Ý Tiết Kiệm Điện Nước</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Đề xuất các biện pháp giảm thiểu hao phí điện nước thực tế dựa trên dữ liệu tiêu thụ trung bình.
          </p>
        </div>

        {/* Room selector */}
        <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="font-semibold text-slate-600">Chọn phòng:</span>
          <select
            value={selectedRoomId}
            onChange={(e) => handleRoomChange(Number(e.target.value))}
            className="border-0 bg-transparent font-bold text-sky-700 focus:outline-none"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_code} - {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="AI đang phân tích thói quen sử dụng và tổng hợp gợi ý..." />
      ) : recommendations ? (
        <div className="space-y-6">
          {/* General Advice Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  ĐÁNH GIÁ CHUNG TỔNG THỂ
                </span>
                <h3 className="text-base sm:text-lg font-black">
                  Tư Vấn Tiết Kiệm Dành Riêng Cho {recommendations.room_code}
                </h3>
                <p className="text-xs sm:text-sm text-amber-50 mt-1.5 leading-relaxed">
                  {recommendations.overall_advice}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {recommendations.recommendations.map((item, idx) => {
              const isElec = item.category === 'ĐIỆN';
              const isWater = item.category === 'NƯỚC';
              const isHigh = item.priority === 'CAO';

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                          isElec
                            ? 'bg-amber-100 text-amber-800'
                            : isWater
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {isElec && <Zap className="w-3.5 h-3.5 fill-amber-500" />}
                        {isWater && <Droplets className="w-3.5 h-3.5 fill-cyan-500" />}
                        <span>{item.category}</span>
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Ưu tiên: {item.priority}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mb-1.5">{item.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>

                  {item.estimated_saving && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Tiết kiệm ước tính:</span>
                      <span className="font-bold text-emerald-600">{item.estimated_saving}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              <b>Lưu ý:</b> Các khuyến nghị từ AI mang tính tham khảo và được tính toán dựa trên dữ liệu tiêu thụ thực tế. AI tuyệt đối không sửa đổi số liệu gốc hay thay thế thuật toán tính toán của hệ thống.
            </span>
          </div>
        </div>
      ) : (
        <EmptyState title="Không có dữ liệu gợi ý" description="Vui lòng thử lại sau." />
      )}
    </div>
  );
};
