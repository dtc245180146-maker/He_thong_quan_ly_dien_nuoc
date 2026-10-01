import React, { useEffect, useState } from 'react';
import { usersApi } from '../../api/client';
import { User } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Plus, Users, Shield, User as UserIcon, Edit2, Trash2, Key, Phone, Mail } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'USER',
    is_active: true,
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        full_name: user.full_name,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        role: 'USER',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.full_name.trim()) {
      error('Tên đăng nhập và họ tên không được để trống.');
      return;
    }

    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          role: formData.role,
          is_active: formData.is_active,
          password: formData.password ? formData.password : undefined,
        });
        success(`Cập nhật người dùng ${formData.username} thành công.`);
      } else {
        if (!formData.password || formData.password.length < 6) {
          error('Mật khẩu tối thiểu 6 ký tự.');
          return;
        }
        await usersApi.create({
          username: formData.username.trim(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          role: formData.role,
          is_active: formData.is_active,
        });
        success(`Tạo người dùng ${formData.username} thành công.`);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (e: any) {
      error(e.message || 'Lỗi khi lưu người dùng.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      success(`Đã xóa người dùng ${deleteTarget.username}.`);
      setDeleteTarget(null);
      loadUsers();
    } catch (e: any) {
      error(e.message || 'Không thể xóa người dùng.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Quản Lý Người Dùng & Phân Quyền</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản trị tài khoản Admin hệ thống và tài khoản Người thuê / Thành viên hộ gia đình.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Người Dùng</span>
        </button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp danh sách tài khoản..." />
        ) : users.length === 0 ? (
          <EmptyState title="Chưa có người dùng nào" description="Hãy tạo tài khoản người dùng mới." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Vai trò (Role)</th>
                  <th className="py-3 px-4">Email / SĐT</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isAdminRole = u.role === 'ADMIN';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg ${
                              isAdminRole ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'
                            }`}
                          >
                            {isAdminRole ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                          </span>
                          <span className="font-mono">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{u.full_name}</td>
                      <td className="py-3 px-4">
                        <Badge status={u.role}>
                          {isAdminRole ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {u.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        )}
                        {u.phone && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                        {!u.email && !u.phone && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge type={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Sửa / Đổi mật khẩu"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
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

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Chỉnh sửa tài khoản ${editingUser.username}` : 'Tạo mới Tài Khoản'}
        subtitle="Quản lý thông tin và phân quyền truy cập"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser}
                placeholder="VD: user_p105"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {editingUser ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? '••••••••' : 'Tối thiểu 6 ký tự'}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required={!editingUser}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Họ và tên người dùng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Vai trò (Phân quyền) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="USER">Người dùng / Cư dân (USER)</option>
                <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="VD: user@email.com"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="u_active_chk"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <label htmlFor="u_active_chk" className="text-sm font-medium text-slate-700">
              Tài khoản đang hoạt động (không bị khóa)
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
              {editingUser ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Xóa tài khoản ${deleteTarget?.username}?`}
        message="Hành động này sẽ xóa vĩnh viễn tài khoản người dùng này. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa tài khoản"
        isLoading={isDeleting}
      />
    </div>
  );
};
