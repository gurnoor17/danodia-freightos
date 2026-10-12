'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import {
  WatchlistItem,
  ShipmentRecord,
  getWatchlist,
  removeFromWatchlist,
  ApiError,
} from '@/lib/api';

export default function WatchlistPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  // Shipment Details Modal State
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);

  // Protect route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Fetch Watchlist items
  const fetchWatchlistData = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    setDataError(null);

    try {
      const items = await getWatchlist(token);
      setWatchlist(items);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to retrieve saved watchlist.';
      setDataError(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchWatchlistData();
    }
  }, [isAuthenticated, token, fetchWatchlistData]);

  // Remove from watchlist handler
  const handleRemove = async (shipmentId: string, invoiceNo: string) => {
    if (!token) return;
    setIsRemovingId(shipmentId);
    try {
      await removeFromWatchlist(token, shipmentId);
      setWatchlist((prev) => prev.filter((item) => item.shipment_id !== shipmentId));
      setSuccessToast(`Shipment ${invoiceNo} removed from watchlist.`);
      if (selectedShipment && selectedShipment.id === shipmentId) {
        setSelectedShipment(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to remove shipment from watchlist.';
      alert(msg);
    } finally {
      setIsRemovingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Transit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending Customs':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Booked':
        return 'bg-indigo-50 text-[#503BFF] border-indigo-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1020] flex relative">
      {/* Loading Progress Bar */}
      {(isLoading || isLoadingData) && (
        <div className="absolute top-0 inset-x-0 h-1 bg-indigo-100 overflow-hidden z-50">
          <div className="h-full bg-[#503BFF] animate-pulse w-full"></div>
        </div>
      )}

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B1020] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            ✓
          </div>
          <span className="text-xs font-semibold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem="watchlist"
        watchlistCount={watchlist.length}
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
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1020]">
                    Saved Watchlist
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-200">
                    {watchlist.length} {watchlist.length === 1 ? 'Shipment' : 'Shipments'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Priority flagged cargo monitored for schedule updates and customs clearances.
                </p>
              </div>
            </div>

            {/* Link back to Dashboard */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {dataError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
              <span>{dataError}</span>
              <button
                onClick={fetchWatchlistData}
                className="underline font-bold hover:text-rose-900 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            {isLoadingData ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <svg className="animate-spin w-8 h-8 text-[#503BFF] mb-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p className="text-sm font-medium text-slate-500">Loading your saved watchlist...</p>
              </div>
            ) : watchlist.length === 0 ? (
              /* Empty State */
              <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-500 shadow-xs mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-bold text-[#0B1020] tracking-tight">
                  Your Watchlist is empty
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                  Bookmark critical shipments directly from the Dashboard table using the star icon to track them here.
                </p>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-[#503BFF] hover:bg-[#432fe0] active:bg-[#3826c7] text-white font-semibold text-sm py-2.5 px-5 rounded-xl shadow-md shadow-[#503BFF]/25 transition-all duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Explore Shipments</span>
                </Link>
              </div>
            ) : (
              /* Watchlist Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Invoice & FBA</th>
                      <th className="py-3 px-4">Origin / Container</th>
                      <th className="py-3 px-4">Manager</th>
                      <th className="py-3 px-4">Expected ETA</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {watchlist.map((item) => {
                      const shipment = item.shipment;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Invoice & FBA */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="font-bold text-[#0B1020]">{shipment.invoice_no}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {shipment.fba_id || '—'}
                            </div>
                          </td>

                          {/* Origin & Container */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#503BFF]"></span>
                              <span>{shipment.region}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[180px]">
                              {shipment.container_no}
                            </div>
                          </td>

                          {/* Manager */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div>{shipment.assigned_manager}</div>
                          </td>

                          {/* Expected ETA */}
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            <div className="font-semibold text-[#0B1020]">{shipment.expected_eta}</div>
                            {shipment.actual_arrival ? (
                              <div className="text-[11px] text-emerald-600">Arrived: {shipment.actual_arrival}</div>
                            ) : (
                              <div className="text-[11px] text-slate-400">Sail: {shipment.sailing_date}</div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                shipment.status
                              )}`}
                            >
                              {shipment.status}
                            </span>
                          </td>

                          {/* Actions: View Details & Remove */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* Open Details Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedShipment(shipment)}
                                className="px-2.5 py-1 text-xs font-semibold text-[#503BFF] bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              >
                                View Details
                              </button>

                              {/* Remove Action Button */}
                              <button
                                type="button"
                                onClick={() => handleRemove(shipment.id, shipment.invoice_no)}
                                disabled={isRemovingId === shipment.id}
                                title="Remove from Watchlist"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isRemovingId === shipment.id ? (
                                  <svg className="animate-spin w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Shipment Details Drawer / Modal */}
      {selectedShipment && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#503BFF] flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#0B1020]">
                    Shipment {selectedShipment.invoice_no}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Container: {selectedShipment.container_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grid of Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Origin Region</span>
                <span className="font-bold text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.region}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-bold text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.category || '—'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Status</span>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold mt-0.5 border ${getStatusBadge(selectedShipment.status)}`}>
                  {selectedShipment.status}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Assigned Manager</span>
                <span className="font-bold text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.assigned_manager}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">FBA Shipment ID</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.fba_id || '—'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Boxes Count</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.number_of_boxes}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Total Weight</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{Number(selectedShipment.total_weight_kg).toFixed(1)} kg</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Volume</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{Number(selectedShipment.volume_cbm).toFixed(2)} CBM</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Pickup Date</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.pickup_date}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Sailing Date</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.sailing_date}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Expected ETA</span>
                <span className="font-bold font-mono text-[#0B1020] text-sm mt-0.5 block">{selectedShipment.expected_eta}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium">Actual Arrival</span>
                <span className="font-bold font-mono text-emerald-600 text-sm mt-0.5 block">{selectedShipment.actual_arrival || 'In Transit'}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleRemove(selectedShipment.id, selectedShipment.invoice_no)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Remove from Watchlist
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#503BFF] hover:bg-[#432fe0] rounded-lg shadow-sm"
                >
                  Open in Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
