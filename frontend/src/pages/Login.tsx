import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Zap, Droplets, Bot, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      error('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ username: username.trim(), password });
      success(`Chào mừng ${res.full_name} đã đăng nhập thành công!`, 'Đăng nhập thành công');
      if (res.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      error(err.message || 'Đăng nhập thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-4">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-8 h-8 fill-amber-400 text-amber-400" />
              <Droplets className="w-8 h-8 fill-cyan-400 text-cyan-400" />
              <Bot className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            QUẢN LÝ ĐIỆN NƯỚC AI
          </h1>
          <p className="text-sky-200/80 text-sm mt-1.5 font-medium">
            Hệ thống Quản lý Hóa đơn Hộ gia đình có Tích hợp AI
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/30">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            Đăng nhập hệ thống
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-semibold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2.5">
              Chọn nhanh tài khoản Demo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'admin123')}
                className="p-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold block">Quản trị viên</span>
                  <span className="text-[10px] text-purple-600/80">admin / admin123</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-purple-200/70 text-[9px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('user_p101', 'user123')}
                className="p-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold block">Phòng 101</span>
                  <span className="text-[10px] text-sky-600/80">user_p101 / user123</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-sky-200/70 text-[9px] font-bold">User</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('user_p103', 'user123')}
                className="col-span-1 sm:col-span-2 p-2.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold block">Phòng 103 (Demo Tăng vọt &gt; 30% AI)</span>
                  <span className="text-[10px] text-amber-700/80">user_p103 / user123</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-[9px] font-bold text-amber-900">
                  Cảnh báo AI
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-sky-200/60">
          Đề tài: Hệ thống quản lý hóa đơn điện nước có tích hợp AI
        </div>
      </div>
    </div>
  );
};
