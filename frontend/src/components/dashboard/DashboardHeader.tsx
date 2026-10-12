'use client';

import React from 'react';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  onExportCsv?: () => void;
}

export function DashboardHeader({ onToggleSidebar, onExportCsv }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-300/80"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1020]">
            Global Shipments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage and track your active freight movements globally.
          </p>
        </div>
      </div>

      {/* Right-aligned Export CSV Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          {/* Download / Export document icon */}
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
}
