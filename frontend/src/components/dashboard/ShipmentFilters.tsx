'use client';

import React from 'react';

export const STATUS_OPTIONS = [
  'All Statuses',
  'In Transit',
  'Pending Customs',
  'Booked',
  'Delivered',
  'Cancelled',
];

export const DEFAULT_STATUS_FILTER = 'All Statuses';

interface ShipmentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  isMockDataActive?: boolean;
  onToggleMockData?: () => void;
}

export function ShipmentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  isMockDataActive = false,
  onToggleMockData,
}: ShipmentFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Status Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="shipment-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Invoice No. or FBA ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0B1020] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative sm:w-52">
            <select
              id="shipment-status-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all appearance-none cursor-pointer pr-9"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Mock Data View Preview Toggle (for testing empty vs populated states) */}
        {onToggleMockData && (
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <button
              type="button"
              id="toggle-mock-data-btn"
              onClick={onToggleMockData}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isMockDataActive
                  ? 'bg-indigo-50 text-[#503BFF] border-indigo-200 hover:bg-indigo-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle between Empty State and Mock Table Data"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span>{isMockDataActive ? 'Showing Sample Data' : 'Showing Empty State'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
