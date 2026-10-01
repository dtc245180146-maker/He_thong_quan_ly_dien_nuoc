import React, { useEffect, useState } from 'react';
import { readingsApi, roomsApi, metersApi } from '../../api/client';
import { MeterReading, Room, Meter } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Plus, PenSquare, Zap, Droplets, Home, Calendar, Trash2, CheckCircle2 } from 'lucide-react';

export const ReadingsPage: React.FC = () => {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Quick Room Entry Modal State
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    room_id: 0,
    period: new Date().toISOString().substring(0, 7), // "YYYY-MM"
    reading_date: new Date().toISOString().split('T')[0],
    electricity_old: 0,
    electricity_new: 0,
    water_old: 0,
    water_new: 0,
    notes: '',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<MeterReading | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [readingsData, roomsData, metersData] = await Promise.all([
        readingsApi.getAll(),
        roomsApi.getAll(),
        metersApi.getAll(),
      ]);
      setReadings(readingsData);
      setRooms(roomsData);
      setMeters(metersData);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải dữ liệu chỉ số.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenQuickModal = async () => {
    const firstRoom = rooms[0];
    const defaultPeriod = new Date().toISOString().substring(0, 7);

    setQuickForm({
      room_id: firstRoom ? firstRoom.id : 0,
      period: defaultPeriod,
      reading_date: new Date().toISOString().split('T')[0],
      electricity_old: 0,
      electricity_new: 0,
      water_old: 0,
      water_new: 0,
      notes: '',
    });

    if (firstRoom) {
      await fetchPreviousReadings(firstRoom.id);
    }

    setIsQuickModalOpen(true);
  };

  const fetchPreviousReadings = async (roomId: number) => {
    const roomMeters = meters.filter((m) => m.room_id === roomId);
    const elecMeter = roomMeters.find((m) => m.meter_type === 'ELECTRICITY');
    const waterMeter = roomMeters.find((m) => m.meter_type === 'WATER');

    let elecOld = 0;
    let waterOld = 0;

    if (elecMeter) {
      try {
        const res = await readingsApi.getLatest(elecMeter.id);
        if (res.has_previous) elecOld = res.latest_reading;
      } catch (e) {}
    }

    if (waterMeter) {
      try {
        const res = await readingsApi.getLatest(waterMeter.id);
        if (res.has_previous) waterOld = res.latest_reading;
      } catch (e) {}
    }

    setQuickForm((prev) => ({
      ...prev,
      room_id: roomId,
      electricity_old: elecOld,
      electricity_new: elecOld,
      water_old: waterOld,
      water_new: waterOld,
    }));
  };

  const handleRoomChange = async (roomId: number) => {
    setQuickForm((prev) => ({ ...prev, room_id: roomId }));
    await fetchPreviousReadings(roomId);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.room_id) {
      error('Vui lòng chọn phòng cần nhập chỉ số.');
      return;
    }
    if (!quickForm.period) {
      error('Vui lòng nhập kỳ ghi chỉ số (dạng YYYY-MM).');
      return;
    }
    if (quickForm.electricity_new < quickForm.electricity_old) {
      error('Chỉ số điện mới không được nhỏ hơn chỉ số cũ.');
      return;
    }
    if (quickForm.water_new < quickForm.water_old) {
      error('Chỉ số nước mới không được nhỏ hơn chỉ số cũ.');
      return;
    }

    try {
      await readingsApi.createQuick({
        room_id: Number(quickForm.room_id),
        period: quickForm.period,
        reading_date: quickForm.reading_date,
        electricity_old: Number(quickForm.electricity_old),
        electricity_new: Number(quickForm.electricity_new),
        water_old: Number(quickForm.water_old),
        water_new: Number(quickForm.water_new),
        notes: quickForm.notes,
      });

      success(`Đã lưu chỉ số kỳ ${quickForm.period} thành công!`);
      setIsQuickModalOpen(false);
      loadData();
    } catch (e: any) {
      error(e.message || 'Lỗi khi lưu chỉ số.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await readingsApi.delete(deleteTarget.id);
      success('Đã xóa bản ghi chỉ số.');
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      error(e.message || 'Không thể xóa chỉ số.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Distinct periods
  const periods = Array.from(new Set(readings.map((r) => r.period))).sort().reverse();

  const filteredReadings = readings.filter((r) => {
    const matchesRoom = selectedRoom === 'ALL' || r.room_id.toString() === selectedRoom;
    const matchesPeriod = selectedPeriod === 'ALL' || r.period === selectedPeriod;
    return matchesRoom && matchesPeriod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Nhập & Quản Lý Chỉ Số</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi nhận số đo đồng hồ điện nước định kỳ, tự động tính toán mức tiêu thụ thực tế.
          </p>
        </div>
        <button
          onClick={handleOpenQuickModal}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi Chỉ Số Kỳ Mới</span>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Chọn phòng:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="py-1 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Tất cả các phòng</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.room_code} - {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Chọn kỳ:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="py-1 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Tất cả các kỳ</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  Kỳ {p}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-slate-400 font-medium text-[11px]">
            Hiển thị: <b>{filteredReadings.length}</b> bản ghi chỉ số
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp dữ liệu chỉ số..." />
        ) : filteredReadings.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu chỉ số"
            description="Hãy nhấn 'Ghi Chỉ Số Kỳ Mới' để nhập số đo cho các phòng."
            action={
              <button
                onClick={handleOpenQuickModal}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Ghi chỉ số
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kỳ ghi</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Đồng hồ / Loại</th>
                  <th className="py-3 px-4">Ngày ghi</th>
                  <th className="py-3 px-4">Chỉ số cũ</th>
                  <th className="py-3 px-4">Chỉ số mới</th>
                  <th className="py-3 px-4">Tiêu thụ thực tế</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReadings.map((reading) => {
                  const isElec = reading.meter_type === 'ELECTRICITY';
                  return (
                    <tr key={reading.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono">
                          {reading.period}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Home className="w-3.5 h-3.5 text-slate-400" />
                          <span>{reading.room_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          {isElec ? (
                            <span className="p-1 rounded bg-amber-50 text-amber-600 flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <b className="font-mono">{reading.meter_code}</b> (Điện)
                            </span>
                          ) : (
                            <span className="p-1 rounded bg-cyan-50 text-cyan-600 flex items-center gap-1">
                              <Droplets className="w-3 h-3 fill-cyan-500 text-cyan-500" />
                              <b className="font-mono">{reading.meter_code}</b> (Nước)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{reading.reading_date}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {reading.old_reading.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {reading.new_reading.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-black font-mono text-sm px-2.5 py-0.5 rounded-lg ${
                            isElec ? 'bg-amber-100 text-amber-900' : 'bg-cyan-100 text-cyan-900'
                          }`}
                        >
                          +{reading.consumption.toLocaleString()} {reading.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(reading)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Quick Room Entry (Section X of Document) */}
      <Modal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        title="Ghi chỉ số Điện & Nước theo kỳ"
        subtitle="Hệ thống tự động nạp chỉ số cũ gần nhất. Nhập chỉ số mới để tính mức tiêu thụ."
        maxWidth="xl"
      >
        <form onSubmit={handleQuickSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Chọn Hộ / Phòng <span className="text-rose-500">*</span>
              </label>
              <select
                value={quickForm.room_id}
                onChange={(e) => handleRoomChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                required
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Kỳ ghi (YYYY-MM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={quickForm.period}
                onChange={(e) => setQuickForm({ ...quickForm, period: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ngày ghi nhận</label>
              <input
                type="date"
                value={quickForm.reading_date}
                onChange={(e) => setQuickForm({ ...quickForm, reading_date: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Electricity Section */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold text-sm">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Chỉ số ĐỒNG HỒ ĐIỆN (kWh)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chỉ số cũ gần nhất
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickForm.electricity_old}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, electricity_old: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Chỉ số mới ghi được <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickForm.electricity_new}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, electricity_new: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 font-bold bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tiêu thụ điện</label>
                <div className="px-3 py-2 text-sm font-black font-mono rounded-xl bg-amber-100 text-amber-950 flex items-center justify-between">
                  <span>+{Math.max(0, quickForm.electricity_new - quickForm.electricity_old).toFixed(1)}</span>
                  <span className="text-xs font-normal">kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Water Section */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200">
            <div className="flex items-center gap-2 mb-3 text-cyan-900 font-bold text-sm">
              <Droplets className="w-4 h-4 fill-cyan-500 text-cyan-500" />
              <span>Chỉ số ĐỒNG HỒ NƯỚC (m³)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chỉ số cũ gần nhất
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickForm.water_old}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, water_old: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-cyan-900 mb-1">
                  Chỉ số mới ghi được <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickForm.water_new}
                  onChange={(e) =>
                    setQuickForm({ ...quickForm, water_new: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-cyan-300 focus:ring-2 focus:ring-cyan-500 font-bold bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tiêu thụ nước</label>
                <div className="px-3 py-2 text-sm font-black font-mono rounded-xl bg-cyan-100 text-cyan-950 flex items-center justify-between">
                  <span>+{Math.max(0, quickForm.water_new - quickForm.water_old).toFixed(1)}</span>
                  <span className="text-xs font-normal">m³</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú kỳ ghi</label>
            <input
              type="text"
              value={quickForm.notes}
              onChange={(e) => setQuickForm({ ...quickForm, notes: e.target.value })}
              placeholder="VD: Kiểm tra đồng hồ định kỳ cuối tháng"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuickModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu & Tính Tiêu Thụ</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa bản ghi chỉ số?"
        message="Hành động này sẽ xóa dữ liệu chỉ số đã chọn. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xóa chỉ số"
        isLoading={isDeleting}
      />
    </div>
  );
};
