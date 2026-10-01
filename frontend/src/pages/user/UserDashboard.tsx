import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi, aiApi } from '../../api/client';
import { UserDashboardStats, AISavingsResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Home,
  Zap,
  Droplets,
  DollarSign,
  AlertTriangle,
  Bot,
  Lightbulb,
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [savings, setSavings] = useState<AISavingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await statsApi.getUserDashboard();
      setStats(data);
      if (data.room_id) {
        try {
          const savingsData = await aiApi.getSavings(data.room_id);
          setSavings(savingsData);
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tải dữ liệu phòng của bạn..." />;
  }

  if (!stats || !stats.room_id) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center max-w-lg mx-auto border border-slate-200 mt-10">
        <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Tài khoản chưa được liên kết phòng</h3>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng liên hệ Quản lý / Chủ nhà để liên kết tài khoản của bạn với số phòng cụ thể.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
            Cổng Thông Tin Cư Dân
          </span>
          <h1 className="text-xl sm:text-2xl font-black mt-1">
            Xin chào, {user?.full_name}!
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/80 mt-1">
            Phòng: <b>{stats.room_code}</b> ({stats.room_name})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/user/invoices"
            className="px-4 py-2.5 rounded-xl bg-white text-sky-900 hover:bg-sky-50 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Xem hóa đơn</span>
          </Link>
          <Link
            to="/user/ai-analysis"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-purple-200" />
            <span>Phân tích AI</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Debt */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Số tiền cần thanh toán</span>
            <div
              className={`text-2xl font-black mt-1 ${
                stats.current_debt > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {stats.current_debt.toLocaleString()} <span className="text-xs font-normal">VNĐ</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {stats.current_debt > 0 ? 'Hóa đơn chưa thanh toán' : 'Đã thanh toán đủ'}
            </span>
          </div>
          <div
            className={`p-3 rounded-2xl ${
              stats.current_debt > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Latest Invoice */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Hóa đơn gần nhất</span>
            <div className="text-base font-bold text-slate-800 mt-1">
              {stats.latest_invoice ? (
                <>
                  {stats.latest_invoice.total_amount.toLocaleString()} VNĐ
                  <div className="text-xs font-normal text-slate-400">
                    Kỳ: {stats.latest_invoice.period}
                  </div>
                </>
              ) : (
                'Chưa có hóa đơn'
              )}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* AI Status for this Room */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Đánh giá tiêu thụ AI</span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {stats.latest_ai_analysis ? (
                stats.latest_ai_analysis.is_anomaly ? (
                  <span className="text-rose-600 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-4 h-4" /> Tăng &gt; 30% (Cần kiểm tra)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold">Bình thường</span>
                )
              ) : (
                <span className="text-slate-400">Chưa chạy phân tích</span>
              )}
            </div>
            <Link
              to="/user/ai-analysis"
              className="text-[11px] text-purple-600 font-bold hover:underline mt-1 inline-block"
            >
              Xem chi tiết AI →
            </Link>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Bot className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Anomaly Alert Highlight if Room has Anomaly */}
      {stats.latest_ai_analysis?.is_anomaly && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-lg">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
                CẢNH BÁO TIÊU THỤ TĂNG BẤT THƯỜNG
              </span>
              <h3 className="text-base font-bold">
                Kỳ {stats.latest_ai_analysis.period} có mức sử dụng tăng trên 30%
              </h3>
              <p className="text-xs text-rose-100 mt-1 leading-relaxed whitespace-pre-line">
                {stats.latest_ai_analysis.alert}
              </p>
              <Link
                to="/user/ai-savings"
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-rose-700 font-bold text-xs shadow hover:bg-rose-50 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Xem gợi ý khắc phục và tiết kiệm</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <Card
        title="Lịch Sử Tiêu Thụ Điện & Nước Của Phòng"
        subtitle="Biểu đồ số liệu sử dụng điện (kWh) và nước (m³) theo từng tháng"
        icon={<Zap className="w-4 h-4 text-amber-500" />}
      >
        <ConsumptionChart data={stats.consumption_history} height={250} />
      </Card>

      {/* AI Tips Preview */}
      {savings && savings.recommendations.length > 0 && (
        <Card
          title="Gợi ý tiết kiệm điện nước từ AI"
          subtitle="Khuyến nghị tối ưu chi phí sinh hoạt hàng tháng"
          icon={<Lightbulb className="w-4 h-4 text-amber-500" />}
          action={
            <Link
              to="/user/ai-savings"
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              <span>Xem toàn bộ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savings.recommendations.slice(0, 2).map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">{item.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    {item.category}
                  </span>
                </div>
                <p className="text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
