import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text = 'Đang tải dữ liệu...',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div
        className={`${sizeMap[size]} border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3`}
      />
      {text && <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};
