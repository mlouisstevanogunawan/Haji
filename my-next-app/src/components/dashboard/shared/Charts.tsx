"use client";

import * as React from "react";

/**
 * 1. AreaRegistrationChart
 * Replicates the "Pendaftaran 12 Bulan Terakhir" area chart in Screenshot 1
 */
export interface RegistrationTrendPoint {
  month: string;
  value: number;
}

export const AreaRegistrationChart: React.FC<{
  data?: RegistrationTrendPoint[];
}> = ({ data }) => {
  const pointsData = data || [];

  const width = 640;
  const height = 220;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(1, ...pointsData.map((d) => d.value));
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxVal / 4) * (4 - i))
  );

  if (pointsData.length === 0) {
    return (
      <p className="py-10 text-center text-xs text-gray-400">
        Belum ada data pendaftaran tersimpan.
      </p>
    );
  }

  const coords = pointsData.map((d, i) => {
    const x = paddingLeft + (i / Math.max(pointsData.length - 1, 1)) * chartWidth;
    const y = paddingTop + (1 - d.value / maxVal) * chartHeight;
    return { x, y, value: d.value, month: d.month };
  });

  // Build curved bezier path
  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }

  const bottomY = paddingTop + chartHeight;
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${bottomY} L ${coords[0].x} ${bottomY} Z`;

  return (
    <div className="w-full select-none">
      {/* Legend Top Badge */}
      <div className="flex justify-center mb-2">
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-teal-600/30 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
          <span className="h-2 w-2 rounded-xs bg-teal-600" />
          Pendaftaran
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="tealAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tick) => {
            const y = paddingTop + (1 - tick / maxVal) * chartHeight;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9px] fill-gray-400 font-sans"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Gradient area */}
          <path d={areaD} fill="url(#tealAreaGrad)" />

          {/* Line curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Points */}
          {coords.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#0d9488"
              stroke="#ffffff"
              strokeWidth="2"
              className="transition-transform hover:scale-150"
            />
          ))}

          {/* X axis month labels */}
          {coords.map((pt, idx) => (
            <text
              key={idx}
              x={pt.x}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] fill-gray-400 font-sans font-medium"
            >
              {pt.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

/**
 * 2. DonutStatusChart
 * Replicates the "Status Pembayaran" Donut chart in Screenshot 1
 */
export const DonutStatusChart: React.FC<{
  lunas?: number;
  sebagian?: number;
  belumBayar?: number;
}> = ({ lunas = 0, sebagian = 0, belumBayar = 0 }) => {
  const total = lunas + sebagian + belumBayar;
  if (total === 0) {
    return (
      <p className="py-16 text-center text-xs text-gray-400">
        Belum ada tagihan tersimpan.
      </p>
    );
  }
  const pLunas = (lunas / total) * 100;
  const pSebagian = (sebagian / total) * 100;
  const pBelum = (belumBayar / total) * 100;

  const size = 180;
  const center = size / 2;
  const strokeWidth = 26;
  const radius = center - strokeWidth / 2 - 8;
  const circumference = 2 * Math.PI * radius;

  // Offsets
  const dashLunas = (pLunas / 100) * circumference;
  const dashSebagian = (pSebagian / 100) * circumference;
  const dashBelum = (pBelum / 100) * circumference;

  const offsetLunas = 0;
  const offsetSebagian = -dashLunas;
  const offsetBelum = -(dashLunas + dashSebagian);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Legend on top */}
      <div className="flex items-center justify-center gap-4 mb-4 text-xs font-medium text-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#16a34a]" />
          <span>Lunas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#f59e0b]" />
          <span>Sebagian</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#dc2626]" />
          <span>Belum Bayar</span>
        </div>
      </div>

      {/* Donut graphic */}
      <div className="relative w-44 h-44 my-1">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {/* Lunas (Green) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#16a34a"
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLunas} ${circumference}`}
            strokeDashoffset={offsetLunas}
            strokeLinecap="butt"
          />
          {/* Sebagian (Orange / Amber) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashSebagian} ${circumference}`}
            strokeDashoffset={offsetSebagian}
            strokeLinecap="butt"
          />
          {/* Belum Bayar (Red) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#dc2626"
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashBelum} ${circumference}`}
            strokeDashoffset={offsetBelum}
            strokeLinecap="butt"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * 3. PackageBarChart
 * Replicates the "Jamaah per Paket" bar chart in Screenshot 1
 */
export interface PackageBarData {
  name: string;
  count: number;
}

export const PackageBarChart: React.FC<{
  data?: PackageBarData[];
}> = ({ data }) => {
  const items = data || [];

  const width = 640;
  const height = 230;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(1, ...items.map((d) => d.count));
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxVal / 4) * (4 - i))
  );

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-xs text-gray-400">
        Belum ada paket dengan pendaftaran tersimpan.
      </p>
    );
  }

  const numBars = items.length;
  const colWidth = chartWidth / numBars;
  const barWidth = Math.min(colWidth * 0.65, 80);

  return (
    <div className="w-full select-none overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[500px]"
        style={{ overflow: "visible" }}
      >
        {/* Y Axis Grid Lines */}
        {yTicks.map((tick) => {
          const y = paddingTop + (1 - tick / maxVal) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-sans"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {items.map((item, idx) => {
          const xCenter = paddingLeft + idx * colWidth + colWidth / 2;
          const x = xCenter - barWidth / 2;
          const barHeight = (item.count / maxVal) * chartHeight;
          const y = paddingTop + chartHeight - barHeight;

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#0d9488"
                rx="2"
                className="transition-all hover:opacity-90"
              />
              <text
                x={xCenter}
                y={height - 14}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 font-sans font-medium"
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Original components preserved for backward compatibility
export const TrendLineChart: React.FC<{
  color?: string;
  dataPoints: number[];
  labels: string[];
  maxVal?: number;
}> = ({
  color = "emerald",
  dataPoints,
  labels,
  maxVal,
}) => {
  const strokeColor = color === "emerald" ? "#0d9488" : "#d97706";

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center text-xs text-slate-400">
        Belum ada data
      </div>
    );
  }

  const effectiveMax = maxVal ?? Math.max(...dataPoints, 1);
  const width = 500;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;

  const points = dataPoints.map((val, idx) => {
    const x = paddingX + (idx / Math.max(dataPoints.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (val / effectiveMax) * (height - 2 * paddingY);
    return { x, y, val };
  });

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const cpX = (current.x + next.x) / 2;
    d += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height + 25}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {gridSteps.map((frac) => {
          const val = Math.round(frac * effectiveMax);
          const y = height - paddingY - frac * (height - 2 * paddingY);
          return (
            <g key={frac}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="end"
                fontFamily="inherit"
              >
                {val}
              </text>
            </g>
          );
        })}

        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#ffffff"
            stroke={strokeColor}
            strokeWidth="2.5"
            className="transition-all hover:scale-125"
          />
        ))}

        {labels.map((label, idx) => {
          const x = paddingX + (idx / Math.max(labels.length - 1, 1)) * (width - 2 * paddingX);
          return (
            <text
              key={label}
              x={x}
              y={height + 15}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
              fontWeight="500"
              fontFamily="inherit"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const DonutChart: React.FC<{
  segments: { label: string; percent: number; count?: string; color: string }[];
}> = ({ segments }) => {
  const size = 160;
  const center = size / 2;
  const strokeWidth = 24;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  if (!segments || segments.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-xs text-slate-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 my-2">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {segments.map((seg, idx) => {
            const strokeDasharray = `${(seg.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += (seg.percent / 100) * circumference;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
      </div>

      <div className="w-full space-y-1.5 mt-2 text-xs">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-slate-600">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span>{seg.label}</span>
            </div>
            <span className="font-bold text-slate-800">
              {seg.count || `${seg.percent}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface OccupancyBarItem {
  label: string;
  terisi: number;
  total: number;
}

export const OccupancyBars: React.FC<{
  items: OccupancyBarItem[];
}> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Belum ada data okupansi
      </div>
    );
  }

  const maxTotal = Math.max(...items.map((i) => i.total), 1);
  const scaleMax = Math.ceil(maxTotal / 15) * 15;
  const scaleSteps = 5;

  return (
    <div className="space-y-4 py-2">
      {items.map((item, idx) => {
        const percent = item.total > 0 ? Math.round((item.terisi / item.total) * 100) : 0;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{item.label}</span>
              <span className="text-slate-400">
                <strong className="text-slate-800">{item.terisi}</strong> / {item.total}
              </span>
            </div>
            <div className="relative h-6 w-full rounded-md bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-md bg-emerald-600 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
        {Array.from({ length: scaleSteps + 1 }, (_, i) => (
          <span key={i}>{Math.round((i / scaleSteps) * scaleMax)}</span>
        ))}
      </div>
    </div>
  );
};
