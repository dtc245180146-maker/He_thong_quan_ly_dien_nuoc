import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có dữ liệu nào trong danh mục này.',
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 mb-3">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-semibold text-slate-700">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
