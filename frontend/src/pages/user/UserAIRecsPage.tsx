import React, { useEffect, useState } from 'react';
import { aiApi, statsApi } from '../../api/client';
import { AISavingsResponse, UserDashboardStats } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Lightbulb, Zap, Droplets, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

export const UserAIRecsPage: React.FC = () => {
  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [savings, setSavings] = useState<AISavingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await statsApi.getUserDashboard();
      setStats(data);
      if (data.room_id) {
        const recs = await aiApi.getSavings(data.room_id);
        setSavings(recs);
      }
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải gợi ý tiết kiệm.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang phân tích và tải gợi ý tiết kiệm..." />;
  }

  if (!savings) {
    return (
      <EmptyState
        title="Chưa có gợi ý"
        description="Chưa đủ dữ liệu tiêu thụ để sinh gợi ý cho phòng này."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
          <Lightbulb className="w-7 h-7 text-amber-500" />
          <span>Gợi Ý Tiết Kiệm Điện Nước Từ AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Các giải pháp cụ thể giúp phòng {savings.room_code} tối ưu hóa tiền điện nước hàng tháng.
        </p>
      </div>

      {/* Overview advice banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
              LỜI KHUYÊN TỪ TRÍ TUỆ NHÂN TẠO
            </span>
            <h3 className="text-base sm:text-lg font-black">
              Chiến Lược Tiết Kiệm Cho Phòng {savings.room_code}
            </h3>
            <p className="text-xs sm:text-sm text-amber-50 mt-1.5 leading-relaxed">
              {savings.overall_advice}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {savings.recommendations.map((item, idx) => {
          const isElec = item.category === 'ĐIỆN';
          const isWater = item.category === 'NƯỚC';
          const isHigh = item.priority === 'CAO';

          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between"
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
                  <span className="text-slate-400 font-medium">Tiềm năng tiết kiệm:</span>
                  <span className="font-bold text-emerald-600">{item.estimated_saving}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          Các gợi ý trên được tính toán tự động dựa trên mức sử dụng bình quân và mang tính hỗ trợ tham khảo.
        </span>
      </div>
    </div>
  );
};
