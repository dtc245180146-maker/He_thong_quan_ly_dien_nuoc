import React, { useState } from 'react';
import { MonthlyStatItem } from '../../types';

interface ConsumptionChartProps {
  data: MonthlyStatItem[];
  height?: number;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ data, height = 260 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-slate-400 text-sm">Chưa có dữ liệu biểu đồ tiêu thụ</div>;
  }

  const maxElec = Math.max(...data.map((d) => d.electricity_usage), 10);
  const maxWater = Math.max(...data.map((d) => d.water_usage), 5);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const width = 600;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(22, (barGroupWidth - 10) / 2);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 inline-block shadow-sm"></span>
            <span className="font-medium text-slate-600">Điện (kWh)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-cyan-500 inline-block shadow-sm"></span>
            <span className="font-medium text-slate-600">Nước (m³)</span>
          </div>
        </div>
        <div className="text-slate-400 text-[11px]">Đơn vị: kWh / m³ theo từng kỳ</div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + chartHeight * (1 - pct);
            const val = Math.round(maxElec * pct);
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
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const groupX = paddingLeft + idx * barGroupWidth + barGroupWidth / 2;
            const elecHeight = (item.electricity_usage / maxElec) * chartHeight;
            const waterHeight = (item.water_usage / maxWater) * chartHeight;

            const elecX = groupX - barWidth - 2;
            const waterX = groupX + 2;

            const elecY = paddingTop + chartHeight - elecHeight;
            const waterY = paddingTop + chartHeight - waterHeight;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all"
              >
                {/* Electricity Bar */}
                <rect
                  x={elecX}
                  y={elecY}
                  width={barWidth}
                  height={Math.max(elecHeight, 2)}
                  rx="4"
                  className={`transition-all duration-300 ${
                    isHovered ? 'fill-amber-600' : 'fill-amber-400'
                  }`}
                />

                {/* Water Bar */}
                <rect
                  x={waterX}
                  y={waterY}
                  width={barWidth}
                  height={Math.max(waterHeight, 2)}
                  rx="4"
                  className={`transition-all duration-300 ${
                    isHovered ? 'fill-cyan-600' : 'fill-cyan-400'
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
                      x={groupX - 55}
                      y={Math.min(elecY, waterY) - 34}
                      width="110"
                      height="28"
                      rx="6"
                      className="fill-slate-900/90 shadow-lg"
                    />
                    <text
                      x={groupX}
                      y={Math.min(elecY, waterY) - 16}
                      textAnchor="middle"
                      className="text-[10px] fill-white font-medium"
                    >
                      {item.electricity_usage} kWh | {item.water_usage} m³
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
