import React, { useEffect, useState } from 'react';
import { roomsApi, usersApi } from '../../api/client';
import { Room, User } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Plus, Search, Edit2, Trash2, Home, UserCheck, Phone, MapPin } from 'lucide-react';

export const RoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_code: '',
    name: '',
    address: '',
    resident_count: 1,
    phone: '',
    is_active: true,
    user_id: 0,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [roomsData, usersData] = await Promise.all([
        roomsApi.getAll(),
        usersApi.getAll(),
      ]);
      setRooms(roomsData);
      setUsers(usersData);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải danh sách phòng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        room_code: room.room_code,
        name: room.name,
        address: room.address || '',
        resident_count: room.resident_count || 1,
        phone: room.phone || '',
        is_active: room.is_active,
        user_id: room.user_id || 0,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        room_code: '',
        name: '',
        address: '',
        resident_count: 1,
        phone: '',
        is_active: true,
        user_id: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_code.trim() || !formData.name.trim()) {
      error('Mã phòng và tên phòng không được để trống.');
      return;
    }

    try {
      if (editingRoom) {
        await roomsApi.update(editingRoom.id, {
          name: formData.name.trim(),
          address: formData.address,
          resident_count: Number(formData.resident_count),
          phone: formData.phone,
          is_active: formData.is_active,
          user_id: formData.user_id ? Number(formData.user_id) : 0,
        });
        success(`Cập nhật thông tin phòng ${editingRoom.room_code} thành công.`);
      } else {
        await roomsApi.create({
          room_code: formData.room_code.trim(),
          name: formData.name.trim(),
          address: formData.address,
          resident_count: Number(formData.resident_count),
          phone: formData.phone,
          is_active: formData.is_active,
          user_id: formData.user_id ? Number(formData.user_id) : null,
        });
        success(`Thêm mới phòng ${formData.room_code} thành công.`);
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
      await roomsApi.delete(deleteTarget.id);
      success(`Đã xóa phòng ${deleteTarget.room_code}.`);
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      error(e.message || 'Không thể xóa phòng.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.room_code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.user_full_name && r.user_full_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Quản Lý Hộ / Phòng</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý thông tin cư dân, địa chỉ, trạng thái hoạt động và liên kết tài khoản.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Hộ / Phòng</span>
        </button>
      </div>

      {/* Filter and Search */}
      <Card>
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã phòng, tên phòng hoặc người thuê..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
            Tổng số: <b>{filteredRooms.length}</b> phòng
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp danh sách phòng..." />
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            title="Không tìm thấy hộ/phòng"
            description="Hãy tạo mới hoặc điều chỉnh từ khóa tìm kiếm."
            action={
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                Tạo phòng mới
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã phòng</th>
                  <th className="py-3 px-4">Tên phòng / Địa chỉ</th>
                  <th className="py-3 px-4">Số người</th>
                  <th className="py-3 px-4">Tài khoản liên kết</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                          <Home className="w-4 h-4" />
                        </span>
                        <span>{room.room_code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{room.name}</div>
                      {room.address && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{room.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-medium">{room.resident_count}</span> người
                    </td>
                    <td className="py-3 px-4">
                      {room.user_full_name ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold text-slate-700">{room.user_full_name}</span>
                          <span className="text-[10px] text-slate-400">(@{room.user_name})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa gán tài khoản</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {room.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{room.phone}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge type={room.is_active ? 'success' : 'neutral'}>
                        {room.is_active ? 'Hoạt động' : 'Tạm khóa'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(room)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(room)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Add / Edit Room */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Chỉnh sửa ${editingRoom.room_code}` : 'Thêm mới Hộ / Phòng'}
        subtitle="Điền các thông tin của căn hộ hoặc phòng cho thuê"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Mã phòng / hộ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.room_code}
                onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
                disabled={!!editingRoom}
                placeholder="VD: P101, P102..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tên phòng / hộ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Phòng 101 (Tầng 1)"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số người ở</label>
              <input
                type="number"
                min="1"
                value={formData.resident_count}
                onChange={(e) => setFormData({ ...formData, resident_count: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ / Vị trí</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: Tòa nhà Xanh - Tầng 1"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Liên kết tài khoản User</label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="0">-- Chưa gán tài khoản nào --</option>
              {users
                .filter((u) => u.role === 'USER')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} (@{u.username})
                  </option>
                ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Tài khoản này sẽ đăng nhập vào cổng User và xem dữ liệu của phòng này.
            </span>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="is_active_chk"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="is_active_chk" className="text-sm font-medium text-slate-700">
              Kích hoạt phòng hoạt động bình thường
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
              {editingRoom ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xóa phòng ${deleteTarget?.room_code}?`}
        message="Hành động này sẽ xóa vĩnh viễn thông tin hộ/phòng và các bản ghi liên quan. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa vĩnh viễn"
        isLoading={isDeleting}
      />
    </div>
  );
};
