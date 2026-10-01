import React, { useState } from 'react';
import { MonthlyStatItem } from '../../types';

interface RevenueChartProps {
  data: MonthlyStatItem[];
  height?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, height = 260 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-slate-400 text-sm">Chưa có dữ liệu biểu đồ doanh thu</div>;
  }

  const maxAmount = Math.max(...data.map((d) => d.total_amount), 100000);

  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const width = 600;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(22, (barGroupWidth - 10) / 2);

  const formatVND = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return `${v}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm"></span>
            <span className="font-medium text-slate-600">Đã thu (VNĐ)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-sm"></span>
            <span className="font-medium text-slate-600">Còn nợ (VNĐ)</span>
          </div>
        </div>
        <div className="text-slate-400 text-[11px]">Đơn vị: VNĐ</div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + chartHeight * (1 - pct);
            const val = maxAmount * pct;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {formatVND(val)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const groupX = paddingLeft + idx * barGroupWidth + barGroupWidth / 2;
            const paidHeight = (item.paid_amount / maxAmount) * chartHeight;
            const debtHeight = (item.debt_amount / maxAmount) * chartHeight;

            const paidX = groupX - barWidth - 2;
            const debtX = groupX + 2;

            const paidY = paddingTop + chartHeight - paidHeight;
            const debtY = paddingTop + chartHeight - debtHeight;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all"
              >
                {/* Paid Bar */}
                <rect
                  x={paidX}
                  y={paidY}
                  width={barWidth}
                  height={Math.max(paidHeight, 2)}
                  rx="4"
                  className={`transition-all duration-300 ${
                    isHovered ? 'fill-emerald-600' : 'fill-emerald-400'
                  }`}
                />

                {/* Debt Bar */}
                <rect
                  x={debtX}
                  y={debtY}
                  width={barWidth}
                  height={Math.max(debtHeight, 2)}
                  rx="4"
                  className={`transition-all duration-300 ${
                    isHovered ? 'fill-rose-600' : 'fill-rose-400'
                  }`}
                />

                {/* X-axis Label (Period) */}
                <text
                  x={groupX}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {item.period}
                </text>

                {/* Hover value indicator */}
                {isHovered && (
                  <g>
                    <rect
                      x={groupX - 75}
                      y={Math.min(paidY, debtY) - 34}
                      width="150"
                      height="28"
                      rx="6"
                      className="fill-slate-900/90 shadow-lg"
                    />
                    <text
                      x={groupX}
                      y={Math.min(paidY, debtY) - 16}
                      textAnchor="middle"
                      className="text-[10px] fill-white font-medium"
                    >
                      Thu: {item.paid_amount.toLocaleString()}đ | Nợ: {item.debt_amount.toLocaleString()}đ
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
