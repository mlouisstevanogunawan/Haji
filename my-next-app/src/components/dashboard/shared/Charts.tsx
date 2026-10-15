"use client";

import * as React from "react";

export const TrendLineChart: React.FC<{
  color?: "emerald" | "amber";
  dataPoints: number[];
  labels: string[];
  maxVal?: number;
}> = ({
  color = "emerald",
  dataPoints,
  labels,
  maxVal,
}) => {
  const strokeColor = color === "emerald" ? "#059669" : "#d97706";

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
