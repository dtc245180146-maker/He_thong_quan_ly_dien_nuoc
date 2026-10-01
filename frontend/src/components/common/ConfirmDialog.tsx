import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-2xl ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} flex-shrink-0`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-sm text-slate-600 leading-relaxed pt-1">
          {message}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 ${
            isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {isLoading ? 'Đang xử lý...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
