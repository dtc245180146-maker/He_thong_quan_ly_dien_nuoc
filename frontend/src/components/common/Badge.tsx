import React from 'react';

interface BadgeProps {
  status?: string;
  type?: 'primary' | 'electric' | 'water' | 'ai' | 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, type, children, size = 'sm' }) => {
  let resolvedType = type || 'neutral';

  if (status) {
    switch (status) {
      case 'PAID':
        resolvedType = 'success';
        break;
      case 'PARTIALLY_PAID':
        resolvedType = 'warning';
        break;
      case 'UNPAID':
        resolvedType = 'danger';
        break;
      case 'ELECTRICITY':
        resolvedType = 'electric';
        break;
      case 'WATER':
        resolvedType = 'water';
        break;
      case 'ADMIN':
        resolvedType = 'ai';
        break;
      case 'USER':
        resolvedType = 'primary';
        break;
    }
  }

  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  const typeStyles = {
    primary: 'bg-sky-100 text-sky-800 border-sky-200',
    electric: 'bg-amber-100 text-amber-800 border-amber-200',
    water: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    ai: 'bg-purple-100 text-purple-800 border-purple-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-rose-100 text-rose-800 border-rose-200',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${typeStyles[resolvedType]}`}
    >
      {children}
    </span>
  );
};
