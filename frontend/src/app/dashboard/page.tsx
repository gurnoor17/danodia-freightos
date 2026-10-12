'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { ShipmentFilters } from '@/components/dashboard/ShipmentFilters';
import { ShipmentResults } from '@/components/dashboard/ShipmentResults';
import { ShipmentModal } from '@/components/dashboard/ShipmentModal';
import {
  ShipmentRecord,
  ShipmentSummaryResponse,
  OriginSummaryData,
  getShipments,
  getShipmentSummary,
  deleteShipment,
  ApiError,
} from '@/lib/api';

const DEFAULT_ORIGIN_SUMMARIES: ShipmentSummaryResponse = {
  all: { id: 'all', title: 'All Origins', shipmentCount: 0, totalWeightKg: 0, totalVolumeCbm: 0, isHighlighted: true },
  usa: { id: 'usa', title: 'USA', shipmentCount: 0, totalWeightKg: 0, totalVolumeCbm: 0 },
  uk: { id: 'uk', title: 'UK', shipmentCount: 0, totalWeightKg: 0, totalVolumeCbm: 0 },
  germany: { id: 'germany', title: 'Germany', shipmentCount: 0, totalWeightKg: 0, totalVolumeCbm: 0 },
  walmart_us: { id: 'walmart_us', title: 'Walmart US', shipmentCount: 0, totalWeightKg: 0, totalVolumeCbm: 0 },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAuth();

  // Navigation & Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [selectedOrigin, setSelectedOrigin] = useState('all');

  // Real Data State
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [summaryData, setSummaryData] = useState<ShipmentSummaryResponse>(DEFAULT_ORIGIN_SUMMARIES);
  const [summaryTotals, setSummaryTotals] = useState({
    totalBoxes: 0,
    totalWeightKg: 0,
    totalVolumeCbm: 0,
  });

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Delete Action State
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<ShipmentRecord | null>(null);

  // Route protection: redirect to /login if unauthenticated
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

  // Fetch Summary Cards Data from PostgreSQL
  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const summary = await getShipmentSummary(token);
      setSummaryData(summary);
    } catch (err) {
      console.error('Failed to load shipment summary:', err);
    }
  }, [token]);

  // Fetch Filtered Shipments from PostgreSQL
  const fetchShipmentList = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    setDataError(null);

    try {
      const result = await getShipments(token, {
        search: searchQuery,
        region: selectedOrigin !== 'all' ? selectedOrigin : undefined,
        status: statusFilter !== 'All Statuses' ? statusFilter : undefined,
      });

      setShipments(result.shipments);
      setSummaryTotals({
        totalBoxes: result.summary.totalBoxes,
        totalWeightKg: result.summary.totalWeightKg,
        totalVolumeCbm: result.summary.totalVolumeCbm,
      });
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Failed to retrieve shipments.';
      setDataError(message);
    } finally {
      setIsLoadingData(false);
    }
  }, [token, searchQuery, selectedOrigin, statusFilter]);

  // Initial and subsequent load
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSummary();
      fetchShipmentList();
    }
  }, [isAuthenticated, token, fetchSummary, fetchShipmentList]);

  // Convert summary response into ordered array for the 5 summary cards
  const originSummariesList: OriginSummaryData[] = useMemo(() => {
    return [
      { ...summaryData.all, isHighlighted: selectedOrigin === 'all' },
      { ...summaryData.usa, isHighlighted: selectedOrigin === 'usa' },
      { ...summaryData.uk, isHighlighted: selectedOrigin === 'uk' },
      { ...summaryData.germany, isHighlighted: selectedOrigin === 'germany' },
      { ...summaryData.walmart_us, isHighlighted: selectedOrigin === 'walmart_us' },
    ];
  }, [summaryData, selectedOrigin]);

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingShipment(null);
    setIsModalOpen(true);
  };

  const handleEditShipment = (shipment: ShipmentRecord) => {
    setEditingShipment(shipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShipment(null);
  };

  const handleModalSuccess = (saved: ShipmentRecord) => {
    fetchSummary();
    fetchShipmentList();
    setSuccessToast(
      editingShipment
        ? `Shipment ${saved.invoice_no} updated successfully.`
        : `Shipment ${saved.invoice_no} created successfully.`
    );
  };

  // Delete Handlers
  const handlePromptDelete = (shipment: ShipmentRecord) => {
    setShipmentToDelete(shipment);
  };

  const handleConfirmDelete = async () => {
    if (!token || !shipmentToDelete) return;
    setIsDeletingId(shipmentToDelete.id);

    try {
      await deleteShipment(token, shipmentToDelete.id);
      setSuccessToast(`Shipment ${shipmentToDelete.invoice_no} deleted successfully.`);
      setShipmentToDelete(null);
      fetchSummary();
      fetchShipmentList();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete shipment.';
      alert(msg);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSelectOrigin = (originId: string) => {
    setSelectedOrigin(originId);
  };

  const handleExportCsv = () => {
    alert('Export CSV will be implemented in a subsequent reporting module.');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1020] flex relative">
      {/* Top subtle verification/loading bar */}
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
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenCreateModal={handleOpenCreateModal}
        activeItem="dashboard"
        shipmentCount={summaryData.all.shipmentCount}
        watchlistCount={0}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* A. Main Dashboard Header */}
          <DashboardHeader
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onExportCsv={handleExportCsv}
          />

          {/* B. Five Summary Cards Grid (Real PostgreSQL Aggregates) */}
          <section
            aria-label="Shipment Origin Summaries"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4"
          >
            {originSummariesList.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                isSelected={selectedOrigin === summary.id}
                onSelect={() => handleSelectOrigin(summary.id)}
              />
            ))}
          </section>

          {/* C. Search & Filter Controls */}
          <section aria-label="Shipment Filters">
            <ShipmentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />
          </section>

          {/* Data Error Banner */}
          {dataError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between">
              <span>{dataError}</span>
              <button
                onClick={() => {
                  fetchSummary();
                  fetchShipmentList();
                }}
                className="underline font-bold hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* D. Shipment Results Area (Live Database Results) */}
          <section aria-label="Shipment Results">
            <ShipmentResults
              shipments={shipments}
              summaryTotals={summaryTotals}
              onOpenAddShipment={handleOpenCreateModal}
              onEditShipment={handleEditShipment}
              onDeleteShipment={handlePromptDelete}
              isDeletingId={isDeletingId}
            />
          </section>
        </main>
      </div>

      {/* 3. Shipment Creation & Editing Modal */}
      <ShipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        initialData={editingShipment}
      />

      {/* 4. Delete Confirmation Dialog */}
      {shipmentToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0B1020]">Confirm Deletion</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete shipment{' '}
              <strong className="text-[#0B1020] font-mono">{shipmentToDelete.invoice_no}</strong> (Container:{' '}
              <span className="font-mono">{shipmentToDelete.container_no}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShipmentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-btn"
                onClick={handleConfirmDelete}
                disabled={!!isDeletingId}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {isDeletingId ? 'Deleting...' : 'Delete Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
