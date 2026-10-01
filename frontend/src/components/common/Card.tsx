import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
  children,
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all duration-200 ${className}`}>
      {(title || action || icon) && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-100">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-800 text-base sm:text-lg">{title}</h3>}
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center space-x-2">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
