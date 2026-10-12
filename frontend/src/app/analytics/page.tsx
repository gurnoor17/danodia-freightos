'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import {
  AnalyticsResponse,
  getAnalytics,
  getWatchlistIds,
  ApiError,
} from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load analytics and watchlist count
  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [analytics, watchlistIds] = await Promise.all([
        getAnalytics(token),
        getWatchlistIds(token).catch(() => []),
      ]);
      setAnalyticsData(analytics);
      setWatchlistCount(watchlistIds.length);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to retrieve analytics data.';
      setDataError(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    }
  }, [isAuthenticated, token, fetchData]);

  const summary = analyticsData?.summary;
  const totalShipments = summary?.total_shipments ?? summary?.totalShipments ?? 0;
  const totalBoxes = summary?.total_boxes ?? summary?.totalBoxes ?? 0;
  const totalWeightKg = summary?.total_weight_kg ?? summary?.totalWeightKg ?? 0;
  const totalVolumeCbm = summary?.total_volume_cbm ?? summary?.totalVolumeCbm ?? 0;
  const arrivedShipments = summary?.arrived_shipments ?? summary?.arrivedShipments ?? 0;
  const pendingShipments = summary?.pending_shipments ?? summary?.pendingShipments ?? 0;
  const delayedShipments = summary?.delayed_shipments ?? summary?.delayedShipments ?? 0;

  const regionList = analyticsData?.by_region ?? analyticsData?.byRegion ?? [];
  const statusList = analyticsData?.by_status ?? analyticsData?.byStatus ?? [];
  const timelineList = analyticsData?.timeline ?? [];

  // Max calculations for chart scaling
  const maxRegionCount = Math.max(...regionList.map((r) => r.count), 1);
  const maxTimelineVolume = Math.max(...timelineList.map((t) => t.volume_cbm ?? t.volumeCbm ?? 0), 1);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1020] flex relative">
      {/* Loading Progress Bar */}
      {(isLoading || isLoadingData) && (
        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-100 overflow-hidden z-50">
          <div className="h-full bg-[#503BFF] animate-pulse w-full"></div>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="analytics"
        shipmentCount={totalShipments}
        watchlistCount={watchlistCount}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar menu"
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-300/80"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1020]">
                  Logistics Analytics
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Real-time PostgreSQL aggregation of global cargo volume, delivery SLA, and route distribution.
                </p>
              </div>
            </div>

            {/* Actions: Refresh & Back to Dashboard */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoadingData}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className={`w-4 h-4 text-slate-500 ${isLoadingData ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </button>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#503BFF] hover:bg-[#432fe0] text-white shadow-xs transition-colors"
              >
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {dataError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
              <span>{dataError}</span>
              <button
                onClick={fetchData}
                className="underline font-bold hover:text-rose-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. Seven Core Logistics Metrics Cards */}
          <section aria-label="Key Performance Indicators" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            
            {/* 1. Total Shipments */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Shipments</span>
              <div className="text-2xl font-extrabold text-[#0B1020] mt-1 font-mono">{totalShipments.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Managed movements</span>
            </div>

            {/* 2. Total Boxes */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Boxes</span>
              <div className="text-2xl font-extrabold text-[#0B1020] mt-1 font-mono">{totalBoxes.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Packaged units</span>
            </div>

            {/* 3. Total Weight */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Cargo Weight</span>
              <div className="text-2xl font-extrabold text-[#0B1020] mt-1 font-mono">
                {totalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Kilograms (kg)</span>
            </div>

            {/* 4. Total Volume */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Total Volume</span>
              <div className="text-2xl font-extrabold text-[#0B1020] mt-1 font-mono">
                {totalVolumeCbm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Cubic Meters (CBM)</span>
            </div>

            {/* 5. Arrived Shipments */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">Arrived</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">{arrivedShipments.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Arrival date recorded</span>
            </div>

            {/* 6. Pending Shipments */}
            <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-xs bg-blue-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 block">Pending</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <div className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">{pendingShipments.toLocaleString()}</div>
              <span className="text-[10px] text-blue-600 mt-0.5 block">ETA in the future</span>
            </div>

            {/* 7. Delayed Shipments */}
            <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">Delayed</span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <div className="text-2xl font-extrabold text-rose-700 mt-1 font-mono">{delayedShipments.toLocaleString()}</div>
              <span className="text-[10px] text-rose-600 mt-0.5 block">ETA passed, not arrived</span>
            </div>
          </section>

          {/* 2. Visualizations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Shipments by Region/Category */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-[#0B1020]">Shipments by Origin Region</h3>
                    <p className="text-xs text-slate-500">Volume and movement count across global shipping corridors.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#503BFF] bg-indigo-50 px-2 py-0.5 rounded-md">
                    {regionList.length} Regions
                  </span>
                </div>

                {regionList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No regional data available yet.
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {regionList.map((r) => {
                      const percentage = totalShipments > 0 ? Math.round((r.count / totalShipments) * 100) : 0;
                      const barWidth = Math.max(Math.round((r.count / maxRegionCount) * 100), 4);
                      const vol = r.volume_cbm ?? r.volumeCbm ?? 0;
                      const wt = r.weight_kg ?? r.weightKg ?? 0;

                      return (
                        <div key={r.region} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="font-bold text-slate-800">{r.region}</span>
                            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                              <span>{r.count} shipments ({percentage}%)</span>
                              <span className="text-slate-300">·</span>
                              <span>{vol.toFixed(1)} CBM ({wt.toLocaleString()} kg)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                            <div
                              className="bg-[#503BFF] h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Shipments by Status */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-[#0B1020]">Shipments by Operational Status</h3>
                    <p className="text-xs text-slate-500">Breakdown of customs, transit, booking, and delivery phases.</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {statusList.length} Statuses
                  </span>
                </div>

                {statusList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No status data available yet.
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {statusList.map((s) => {
                      const percentage = totalShipments > 0 ? Math.round((s.count / totalShipments) * 100) : 0;
                      let barColor = 'bg-slate-400';
                      if (s.status === 'In Transit') barColor = 'bg-blue-500';
                      if (s.status === 'Delivered') barColor = 'bg-emerald-500';
                      if (s.status === 'Booked') barColor = 'bg-[#503BFF]';
                      if (s.status === 'Pending Customs') barColor = 'bg-amber-500';
                      if (s.status === 'Cancelled') barColor = 'bg-rose-500';

                      return (
                        <div key={s.status} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${barColor}`}></span>
                              <span className="font-bold text-slate-800">{s.status}</span>
                            </div>
                            <span className="font-mono text-slate-600 text-[11px]">
                              {s.count} {s.count === 1 ? 'shipment' : 'shipments'} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                            <div
                              className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart 3: Monthly Timeline of Shipments & Cargo Volume */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-[#0B1020]">Logistics Volume Trend Over Time</h3>
                <p className="text-xs text-slate-500">Monthly shipment frequency and cubic meter cargo volume based on pickup schedule.</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                12 Months Window
              </span>
            </div>

            {timelineList.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No monthly schedule records found. Add shipments with valid pickup dates to view timelines.
              </div>
            ) : (
              <div className="pt-4">
                {/* SVG / Responsive Bar Chart */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-3 items-end h-48 sm:h-52 pt-4 px-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  {timelineList.map((item) => {
                    const vol = item.volume_cbm ?? item.volumeCbm ?? 0;
                    const heightPercent = maxTimelineVolume > 0 ? Math.max(Math.round((vol / maxTimelineVolume) * 100), 8) : 8;

                    return (
                      <div key={item.month} className="flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-[#0B1020] text-white text-[10px] px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                          {vol.toFixed(1)} CBM ({item.count} shp)
                        </div>

                        {/* Value label */}
                        <span className="text-[10px] font-mono font-bold text-slate-500 mb-1 group-hover:text-[#503BFF]">
                          {vol.toFixed(0)}m³
                        </span>

                        {/* Bar */}
                        <div className="w-full max-w-[28px] bg-slate-200 rounded-t-md overflow-hidden flex flex-col justify-end h-32">
                          <div
                            className="w-full bg-gradient-to-t from-[#503BFF] to-indigo-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] font-mono text-slate-600 mt-2 truncate w-full text-center">
                          {item.month}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 px-1">
                  <span>Bars represent monthly CBM cargo volume</span>
                  <span>Source: Authenticated PostgreSQL records</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
