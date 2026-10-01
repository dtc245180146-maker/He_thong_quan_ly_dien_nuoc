import React, { useEffect, useState } from 'react';
import { metersApi, roomsApi } from '../../api/client';
import { Meter, Room } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Plus, Gauge, Zap, Droplets, Edit2, Trash2, Home, Calendar } from 'lucide-react';

export const MetersPage: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [formData, setFormData] = useState({
    meter_code: '',
    meter_type: 'ELECTRICITY' as 'ELECTRICITY' | 'WATER',
    unit: 'kWh',
    room_id: 0,
    installation_date: new Date().toISOString().split('T')[0],
    is_active: true,
    notes: '',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metersData, roomsData] = await Promise.all([
        metersApi.getAll(),
        roomsApi.getAll(),
      ]);
      setMeters(metersData);
      setRooms(roomsData);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải danh sách đồng hồ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (meter?: Meter) => {
    if (meter) {
      setEditingMeter(meter);
      setFormData({
        meter_code: meter.meter_code,
        meter_type: meter.meter_type,
        unit: meter.unit,
        room_id: meter.room_id,
        installation_date: meter.installation_date || new Date().toISOString().split('T')[0],
        is_active: meter.is_active,
        notes: meter.notes || '',
      });
    } else {
      setEditingMeter(null);
      setFormData({
        meter_code: '',
        meter_type: 'ELECTRICITY',
        unit: 'kWh',
        room_id: rooms.length > 0 ? rooms[0].id : 0,
        installation_date: new Date().toISOString().split('T')[0],
        is_active: true,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meter_code.trim()) {
      error('Mã đồng hồ không được để trống.');
      return;
    }
    if (!formData.room_id) {
      error('Vui lòng chọn phòng gắn đồng hồ.');
      return;
    }

    try {
      if (editingMeter) {
        await metersApi.update(editingMeter.id, {
          meter_code: formData.meter_code.trim(),
          meter_type: formData.meter_type,
          unit: formData.unit,
          room_id: Number(formData.room_id),
          installation_date: formData.installation_date,
          is_active: formData.is_active,
          notes: formData.notes,
        });
        success(`Cập nhật thông tin đồng hồ ${formData.meter_code} thành công.`);
      } else {
        await metersApi.create({
          meter_code: formData.meter_code.trim(),
          meter_type: formData.meter_type,
          unit: formData.meter_type === 'ELECTRICITY' ? 'kWh' : 'm³',
          room_id: Number(formData.room_id),
          installation_date: formData.installation_date,
          is_active: formData.is_active,
          notes: formData.notes,
        });
        success(`Thêm mới đồng hồ ${formData.meter_code} thành công.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      error(e.message || 'Có lỗi xảy ra.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await metersApi.delete(deleteTarget.id);
      success(`Đã xóa đồng hồ ${deleteTarget.meter_code}.`);
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      error(e.message || 'Không thể xóa đồng hồ.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMeters = meters.filter((m) => {
    const matchesType = selectedType === 'ALL' || m.meter_type === selectedType;
    const matchesRoom = selectedRoom === 'ALL' || m.room_id.toString() === selectedRoom;
    return matchesType && matchesRoom;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Quản Lý Đồng Hồ Đo</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý đồng hồ điện (kWh) và đồng hồ nước (m³) được gán cho từng hộ/phòng.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Đồng Hồ Mới</span>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Loại đồng hồ:</span>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setSelectedType('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedType === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedType('ELECTRICITY')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedType === 'ELECTRICITY' ? 'bg-amber-500 text-white shadow' : 'text-slate-500'
                }`}
              >
                Điện (kWh)
              </button>
              <button
                onClick={() => setSelectedType('WATER')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedType === 'WATER' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500'
                }`}
              >
                Nước (m³)
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Phòng:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="py-1 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="ALL">Tất cả phòng</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.room_code} - {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp danh sách đồng hồ..." />
        ) : filteredMeters.length === 0 ? (
          <EmptyState
            title="Không tìm thấy đồng hồ"
            description="Hãy gắn đồng hồ mới cho các phòng."
            action={
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Thêm đồng hồ
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã đồng hồ</th>
                  <th className="py-3 px-4">Loại thiết bị</th>
                  <th className="py-3 px-4">Đơn vị đo</th>
                  <th className="py-3 px-4">Phòng gắn đồng hồ</th>
                  <th className="py-3 px-4">Ngày lắp đặt</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeters.map((meter) => {
                  const isElec = meter.meter_type === 'ELECTRICITY';
                  return (
                    <tr key={meter.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              isElec ? 'bg-amber-50 text-amber-600' : 'bg-cyan-50 text-cyan-600'
                            }`}
                          >
                            <Gauge className="w-4 h-4" />
                          </span>
                          <span>{meter.meter_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {isElec ? (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="font-semibold text-amber-700 text-xs">Đồng hồ điện</span>
                            </>
                          ) : (
                            <>
                              <Droplets className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500" />
                              <span className="font-semibold text-cyan-700 text-xs">Đồng hồ nước</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{meter.unit}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Home className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meter.room_code}</span>
                          <span className="text-xs font-normal text-slate-400">({meter.room_name})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {meter.installation_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{meter.installation_date}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={meter.is_active ? 'success' : 'neutral'}>
                          {meter.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(meter)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(meter)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Add / Edit Meter */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeter ? `Chỉnh sửa đồng hồ ${editingMeter.meter_code}` : 'Thêm mới Đồng hồ đo'}
        subtitle="Khai báo thông số và liên kết với hộ/phòng"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Mã đồng hồ / Seri <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.meter_code}
                onChange={(e) => setFormData({ ...formData, meter_code: e.target.value })}
                placeholder="VD: EM-P101, WM-P101"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Loại đồng hồ <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.meter_type}
                onChange={(e) => {
                  const type = e.target.value as 'ELECTRICITY' | 'WATER';
                  setFormData({
                    ...formData,
                    meter_type: type,
                    unit: type === 'ELECTRICITY' ? 'kWh' : 'm³',
                  });
                }}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="ELECTRICITY">Điện (kWh)</option>
                <option value="WATER">Nước (m³)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Hộ / Phòng gắn đồng hồ <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                required
              >
                <option value="0">-- Chọn phòng --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_code} - {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ngày lắp đặt</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú thiết bị</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Vị trí lắp, hãng sản xuất, niêm phong chì..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="m_active_chk"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="m_active_chk" className="text-sm font-medium text-slate-700">
              Đồng hồ đang hoạt động bình thường
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20"
            >
              {editingMeter ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xóa đồng hồ ${deleteTarget?.meter_code}?`}
        message="Bạn có chắc chắn muốn xóa đồng hồ này? Tất cả các bản ghi chỉ số liên quan sẽ bị xóa theo."
        confirmText="Xóa đồng hồ"
        isLoading={isDeleting}
      />
    </div>
  );
};
