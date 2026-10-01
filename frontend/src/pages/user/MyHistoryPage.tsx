import React, { useEffect, useState } from 'react';
import { statsApi } from '../../api/client';
import { MonthlyStatItem } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { BarChart3, TrendingUp, Zap, Droplets } from 'lucide-react';

export const MyHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<MonthlyStatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await statsApi.getHistory();
      setHistory(data);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải lịch sử tiêu thụ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-sky-600" />
          <span>Lịch Sử Tiêu Thụ Điện Nước</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Theo dõi số lượng điện (kWh) và nước (m³) đã sử dụng của phòng qua các tháng.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Đang nạp dữ liệu lịch sử..." />
      ) : history.length === 0 ? (
        <Card>
          <EmptyState
            title="Chưa có dữ liệu lịch sử"
            description="Phòng của bạn chưa có bản ghi số đo tiêu thụ nào."
          />
        </Card>
      ) : (
        <>
          {/* Chart Card */}
          <Card
            title="Biểu đồ Tiêu thụ Điện Nước theo Kỳ"
            subtitle="So sánh lượng điện và nước giữa các tháng"
            icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
          >
            <ConsumptionChart data={history} height={280} />
          </Card>

          {/* Data Table */}
          <Card title="Bảng đối soát chi tiết từng tháng">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kỳ ghi nhận</th>
                    <th className="py-3 px-4">Điện tiêu thụ</th>
                    <th className="py-3 px-4">Tiền điện</th>
                    <th className="py-3 px-4">Nước tiêu thụ</th>
                    <th className="py-3 px-4">Tiền nước</th>
                    <th className="py-3 px-4 font-bold text-slate-800">Tổng hóa đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <tr key={item.period} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 font-mono text-xs">
                        {item.period}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-700 font-mono">
                          {item.electricity_usage} kWh
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {item.electricity_cost.toLocaleString()} VNĐ
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-cyan-700 font-mono">
                          {item.water_usage} m³
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {item.water_cost.toLocaleString()} VNĐ
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        {item.total_amount.toLocaleString()} VNĐ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
