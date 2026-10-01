import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = (message: string, title?: string) => addToast(message, 'success', title);
  const error = (message: string, title?: string) => addToast(message, 'error', title);
  const warning = (message: string, title?: string) => addToast(message, 'warning', title);
  const info = (message: string, title?: string) => addToast(message, 'info', title);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
                isSuccess
                  ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                  : isError
                  ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                  : isWarning
                  ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                  : 'bg-sky-50/95 border-sky-300 text-sky-950'
              }`}
            >
              <div className="mr-3 flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <XCircle className="w-5 h-5 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-600" />}
              </div>
              <div className="flex-1 text-sm mr-2">
                {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
                <div className="leading-snug">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
