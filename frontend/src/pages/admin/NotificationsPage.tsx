import React, { useEffect, useState } from 'react';
import { notificationsApi } from '../../api/client';
import { Notification } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, AlertTriangle, Info, CreditCard } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsApi.getAll(false);
      setNotifications(data);
    } catch (e: any) {
      error(e.message || 'Lỗi khi tải thông báo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e: any) {
      error(e.message || 'Lỗi khi cập nhật thông báo.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success('Đã đánh dấu tất cả thông báo là đã đọc.');
    } catch (e: any) {
      error(e.message || 'Lỗi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-sky-600" />
            <span>Trung Tâm Thông Báo Hệ Thống</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Các tin báo tự động về biến động tiêu thụ bất thường, nhắc hạn thanh toán và cập nhật.
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <LoadingSpinner text="Đang nạp danh sách thông báo..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="Không có thông báo"
            description="Bạn đã đọc hết mọi thông báo trong hệ thống."
            icon={<Bell className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const isAnomaly = n.type === 'ANOMALY';
              const isPayment = n.type === 'PAYMENT';

              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-4 transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                    !n.is_read ? 'bg-sky-50/50 hover:bg-sky-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`p-2.5 rounded-2xl flex-shrink-0 mt-0.5 ${
                        isAnomaly
                          ? 'bg-rose-100 text-rose-600'
                          : isPayment
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-sky-100 text-sky-600'
                      }`}
                    >
                      {isAnomaly ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : isPayment ? (
                        <CreditCard className="w-5 h-5" />
                      ) : (
                        <Info className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                        {n.message}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-2 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-bold whitespace-nowrap self-start"
                    >
                      Đã đọc
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
