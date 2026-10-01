import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { User, Lock, Shield, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { success, error } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      error('Vui lòng điền đầy đủ mật khẩu cũ và mới.');
      return;
    }
    if (newPassword.length < 6) {
      error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      success('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      error(e.message || 'Không thể đổi mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800">Thông Tin Hồ Sơ & Bảo Mật</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Xem thông tin tài khoản và cập nhật mật khẩu bảo vệ truy cập hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="flex flex-col items-center text-center p-2">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-3">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">{user?.full_name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">@{user?.username}</p>

              <div className="mt-3">
                <Badge status={user?.role}>
                  {isAdmin ? 'Quản trị viên (Admin)' : `Cư dân (${user?.room_code || 'Chưa gán'})`}
                </Badge>
              </div>

              <div className="w-full border-t border-slate-100 my-4"></div>

              <div className="w-full text-left space-y-2.5 text-xs">
                <div className="flex items-center text-slate-600 gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Vai trò: <b>{user?.role}</b></span>
                </div>
                {user?.room_code && (
                  <div className="flex items-center text-slate-600 gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Phòng liên kết: <b>{user.room_code}</b></span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Change Password Card */}
        <div className="md:col-span-2">
          <Card
            title="Đổi Mật Khẩu Cá Nhân"
            subtitle="Để bảo mật an toàn, hãy sử dụng mật khẩu mạnh kết hợp chữ và số."
            icon={<Lock className="w-4 h-4 text-sky-600" />}
          >
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
