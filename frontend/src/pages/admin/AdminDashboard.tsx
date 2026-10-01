import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../../api/client';
import { AdminDashboardStats } from '../../types';
import { Card } from '../../components/common/Card';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Home,
  Gauge,
  Zap,
  Droplets,
  DollarSign,
  AlertCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Bot
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await statsApi.getAdminDashboard();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Đang tổng hợp dữ liệu báo cáo hệ thống..." />;
  }

  if (!stats) {
    return <div className="text-center py-12 text-slate-500">Không thể tải dữ liệu thống kê.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-6 text-white shadow-xl">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-sky-300">Tổng quan quản trị</span>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Hệ Thống Quản Lý Điện Nước & AI</h1>
          <p className="text-xs sm:text-sm text-sky-100/80 mt-1">
            Theo dõi chỉ số, lập hóa đơn tự động và phát hiện bất thường tiêu thụ bằng AI.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/readings"
            className="px-4 py-2.5 rounded-xl bg-white text-sky-900 hover:bg-sky-50 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Nhập chỉ số</span>
          </Link>
          <Link
            to="/admin/ai-analysis"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-purple-200" />
            <span>Chạy AI phân tích</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rooms */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Tổng số phòng</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.total_rooms}</div>
            <span className="text-[11px] text-slate-400">Đang hoạt động</span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Meters */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Đồng hồ đo</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.total_meters}</div>
            <span className="text-[11px] text-slate-400">Điện & Nước</span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Electricity Usage */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Điện tiêu thụ</span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {stats.total_electricity_usage.toLocaleString()} <span className="text-xs font-normal">kWh</span>
            </div>
            <span className="text-[11px] text-slate-400">Tổng các kỳ</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500 text-amber-500" />
          </div>
        </div>

        {/* Water Usage */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Nước tiêu thụ</span>
            <div className="text-xl sm:text-2xl font-black text-cyan-600 mt-1">
              {stats.total_water_usage.toLocaleString()} <span className="text-xs font-normal">m³</span>
            </div>
            <span className="text-[11px] text-slate-400">Tổng các kỳ</span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600">
            <Droplets className="w-5 h-5 sm:w-6 sm:h-6 fill-cyan-500 text-cyan-500" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Doanh thu đã thu</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
              {stats.total_revenue.toLocaleString()} <span className="text-xs font-normal">VNĐ</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              {stats.paid_invoices_count} hóa đơn đã trả
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Debt */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Tổng công nợ</span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
              {stats.total_debt.toLocaleString()} <span className="text-xs font-normal">VNĐ</span>
            </div>
            <span className="text-[11px] text-rose-600 font-medium">
              {stats.unpaid_invoices_count} hóa đơn chưa xong
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Unpaid invoices */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Hóa đơn chờ xử lý</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {stats.unpaid_invoices_count}
            </div>
            <span className="text-[11px] text-slate-400">Chưa thanh toán / nợ</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* AI Anomalies */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Cảnh báo AI (&gt;30%)</span>
            <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">
              {stats.anomalies_count}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">Mức tăng đột biến</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Xu hướng tiêu thụ Điện & Nước"
          subtitle="Biến động tổng lượng sử dụng qua các kỳ ghi"
          icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
        >
          <ConsumptionChart data={stats.monthly_stats} height={260} />
        </Card>

        <Card
          title="Tài chính: Doanh thu & Công nợ"
          subtitle="Tỷ lệ số tiền đã thu và số tiền còn nợ theo từng tháng"
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        >
          <RevenueChart data={stats.monthly_stats} height={260} />
        </Card>
      </div>

      {/* Recent AI Anomalies Section */}
      <Card
        title="Cảnh báo bất thường gần đây từ AI (Biến động tiêu thụ > 30%)"
        subtitle="Hệ thống tự động phát hiện các hộ/phòng có mức sử dụng tăng vọt so với tháng trước"
        icon={<Bot className="w-5 h-5 text-purple-600" />}
        action={
          <Link
            to="/admin/ai-analysis"
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
          >
            <span>Chi tiết phân tích AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {stats.recent_anomalies.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Chưa có cảnh báo bất thường nào được ghi nhận.
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recent_anomalies.map((an) => (
              <div
                key={an.id}
                className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{an.room_code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                      Kỳ {an.period}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {an.alert}
                  </p>
                </div>
                <Link
                  to={`/admin/ai-analysis?room_id=${an.room_id}`}
                  className="px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold whitespace-nowrap self-start sm:self-auto transition-colors"
                >
                  Kiểm tra
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
