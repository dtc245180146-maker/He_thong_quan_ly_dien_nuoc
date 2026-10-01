import React, { useEffect, useState } from 'react';
import { statsApi, roomsApi } from '../../api/client';
import { MonthlyStatItem, RoomUsageItem, Room } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { ConsumptionChart } from '../../components/charts/ConsumptionChart';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BarChart3, TrendingUp, DollarSign, Home, Zap, Droplets, Filter } from 'lucide-react';

export const StatsPage: React.FC = () => {
  const [history, setHistory] = useState<MonthlyStatItem[]>([]);
  const [roomSummaries, setRoomSummaries] = useState<RoomUsageItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const { error } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedRoom]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [roomsData, historyData, summariesData] = await Promise.all([
        roomsApi.getAll(),
        statsApi.getHistory(selectedRoom === 'ALL' ? undefined : Number(selectedRoom)),
        statsApi.getRoomsSummary(),
      ]);
      setRooms(roomsData);
      setHistory(historyData);
      setRoomSummaries(summariesData);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalElec = history.reduce((acc, h) => acc + h.electricity_usage, 0);
  const totalWater = history.reduce((acc, h) => acc + h.water_usage, 0);
  const totalRevenue = history.reduce((acc, h) => acc + h.paid_amount, 0);
  const totalDebt = history.reduce((acc, h) => acc + h.debt_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Thống Kê Tiêu Thụ & Doanh Thu</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Phân tích số liệu tổng hợp mức tiêu thụ điện nước và dòng tiền theo thời gian và từng phòng.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Lọc theo phòng:</span>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="border-0 bg-transparent font-bold text-sky-700 focus:outline-none"
          >
            <option value="ALL">Toàn bộ khu vực</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id.toString()}>
                {r.room_code} - {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold mb-1">
            <Zap className="w-4 h-4 fill-amber-500" />
            <span>Tổng điện năng</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalElec.toLocaleString()} kWh</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold mb-1">
            <Droplets className="w-4 h-4 fill-cyan-500" />
            <span>Tổng khối lượng nước</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalWater.toLocaleString()} m³</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Tổng tiền đã thu</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{totalRevenue.toLocaleString()}đ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Tổng nợ chưa thu</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">{totalDebt.toLocaleString()}đ</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Biểu đồ Tiêu thụ Điện Nước"
          subtitle={selectedRoom === 'ALL' ? 'Toàn bộ các phòng theo kỳ' : `Số liệu riêng của phòng đã chọn`}
          icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
        >
          <ConsumptionChart data={history} height={260} />
        </Card>

        <Card
          title="Biểu đồ Thu Tiền & Nợ Đọng"
          subtitle="Đối soát số tiền thực thu và công nợ phát sinh theo từng tháng"
          icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
        >
          <RevenueChart data={history} height={260} />
        </Card>
      </div>

      {/* Room Summary Comparison Table */}
      <Card
        title="Bảng so sánh tổng hợp các phòng"
        subtitle="Tổng lượng tiêu thụ và tình hình công nợ lũy kế theo từng hộ/phòng"
        icon={<Home className="w-4 h-4 text-indigo-600" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã phòng</th>
                <th className="py-3 px-4">Tên phòng</th>
                <th className="py-3 px-4 text-right">Tổng điện (kWh)</th>
                <th className="py-3 px-4 text-right">Tổng nước (m³)</th>
                <th className="py-3 px-4 text-right">Tổng tiền phát sinh</th>
                <th className="py-3 px-4 text-right">Công nợ hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomSummaries.map((r) => (
                <tr key={r.room_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{r.room_code}</td>
                  <td className="py-3 px-4 text-slate-600">{r.room_name}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                    {r.electricity_usage.toLocaleString()} kWh
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-700">
                    {r.water_usage.toLocaleString()} m³
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {r.total_amount.toLocaleString()}đ
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    {r.debt_amount > 0 ? (
                      <span className="text-rose-600 font-black">{r.debt_amount.toLocaleString()}đ</span>
                    ) : (
                      <span className="text-emerald-600">0đ (Hết nợ)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
