import React, { useState, useEffect } from 'react';
import { Menu, Bell, Bot, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../api/client';
import { Notification } from '../types';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getAll(true);
      setNotifications(data);
    } catch (e) {
      // ignore
    }
  };

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: menu toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">Hệ thống Quản lý Điện Nước</span>
          <span>/</span>
          <span className="text-sky-600 font-medium">
            {isAdmin ? 'Quản lý tập trung' : `Cổng hộ dân (${user?.room_code || 'Chưa gán'})`}
          </span>
        </div>
      </div>

      {/* Right section: AI badge, notifications, profile */}
      <div className="flex items-center space-x-3">
        {/* AI Status Chip */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
          <Bot className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>AI Engine: Active</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm">Thông báo ({unreadCount})</span>
                <Link
                  to={isAdmin ? '/admin/notifications' : '/user/notifications'}
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-sky-600 hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>
              <div className="max-h-72 overflow-y-auto px-2 py-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">Không có thông báo mới</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar chip */}
        <Link
          to={isAdmin ? '/admin/profile' : '/user/profile'}
          className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-700">
            {user?.full_name}
          </span>
        </Link>
      </div>
    </header>
  );
};
