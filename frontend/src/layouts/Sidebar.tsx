import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Home,
  Gauge,
  Tag,
  PenSquare,
  FileText,
  CreditCard,
  BarChart3,
  Bot,
  Lightbulb,
  Bell,
  UserCheck,
  LogOut,
  Zap,
  Droplets,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();

  const adminNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Quản lý người dùng' },
    { to: '/admin/rooms', icon: Home, label: 'Hộ/Phòng' },
    { to: '/admin/meters', icon: Gauge, label: 'Đồng hồ' },
    { to: '/admin/prices', icon: Tag, label: 'Đơn giá' },
    { to: '/admin/readings', icon: PenSquare, label: 'Nhập chỉ số' },
    { to: '/admin/invoices', icon: FileText, label: 'Hóa đơn' },
    { to: '/admin/payments', icon: CreditCard, label: 'Thanh toán & Công nợ' },
    { to: '/admin/stats', icon: BarChart3, label: 'Thống kê' },
    { to: '/admin/ai-analysis', icon: Bot, label: 'AI phân tích', badge: 'AI' },
    { to: '/admin/ai-savings', icon: Lightbulb, label: 'AI gợi ý' },
    { to: '/admin/notifications', icon: Bell, label: 'Thông báo' },
    { to: '/admin/profile', icon: UserCheck, label: 'Hồ sơ' },
  ];

  const userNavItems = [
    { to: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/user/invoices', icon: FileText, label: 'Hóa đơn' },
    { to: '/user/history', icon: BarChart3, label: 'Lịch sử tiêu thụ' },
    { to: '/user/ai-analysis', icon: Bot, label: 'AI phân tích', badge: 'AI' },
    { to: '/user/ai-savings', icon: Lightbulb, label: 'AI gợi ý tiết kiệm' },
    { to: '/user/notifications', icon: Bell, label: 'Thông báo' },
    { to: '/user/profile', icon: UserCheck, label: 'Hồ sơ' },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 to-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-500/20">
              <div className="flex -space-x-1 items-center">
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <Droplets className="w-4 h-4 fill-cyan-200 text-cyan-200" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-sm tracking-tight block leading-tight">
                ĐIỆN NƯỚC AI
              </span>
              <span className="text-[10px] font-medium text-sky-600 block">
                {isAdmin ? 'Quản trị hệ thống' : 'Cổng hộ gia đình'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm shadow-inner">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{user?.full_name}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
              <span>{isAdmin ? 'Quản trị viên' : `Phòng ${user?.room_code || 'Chưa gán'}`}</span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold shadow-sm shadow-sky-100 border border-sky-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
