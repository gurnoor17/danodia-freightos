'use client';

import React from 'react';
import { OriginSummaryData } from '@/lib/api';

interface SummaryCardProps {
  summary: OriginSummaryData;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SummaryCard({ summary, isSelected = false, onSelect }: SummaryCardProps) {
  const isAllOrigins = summary.id === 'all';
  const highlighted = isSelected || summary.isHighlighted;
  const count = summary.shipmentCount ?? 0;
  const weight = summary.totalWeightKg ?? 0;
  const volume = summary.totalVolumeCbm ?? 0;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl p-4 sm:p-5 transition-all duration-150 cursor-pointer ${
        highlighted
          ? 'border-2 border-[#503BFF] shadow-xs'
          : 'border border-slate-200/90 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Card Header: Origin Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Subtle origin indicator dot */}
          <span
            className={`w-2 h-2 rounded-full ${
              isAllOrigins
                ? 'bg-[#503BFF]'
                : summary.id === 'usa'
                ? 'bg-blue-600'
                : summary.id === 'uk'
                ? 'bg-red-500'
                : summary.id === 'germany'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
          <h3 className="text-sm font-bold text-[#0B1020] tracking-tight">
            {summary.title}
          </h3>
        </div>

        {isAllOrigins && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#503BFF] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            Global
          </span>
        )}
      </div>

      {/* Main Metric: Shipment Count */}
      <div className="py-3">
        <div className="text-2xl font-extrabold text-[#0B1020]">
          {count}
        </div>
        <div className="text-xs text-slate-400 font-medium mt-0.5">
          {count === 1 ? 'Active Shipment' : 'Active Shipments'}
        </div>
      </div>

      {/* Cargo Sub-metrics: Weight & Volume */}
      <div className="pt-2.5 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="block text-[11px] text-slate-400 font-medium">Total Weight</span>
          <span className="font-semibold text-slate-700 font-mono">
            {Number(weight).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-slate-400 font-medium">Total Volume</span>
          <span className="font-semibold text-slate-700 font-mono">
            {Number(volume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CBM
          </span>
        </div>
      </div>
    </div>
  );
}
