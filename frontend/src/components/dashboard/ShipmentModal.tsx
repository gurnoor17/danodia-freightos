'use client';

import React, { useEffect } from 'react';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShipmentModal({ isOpen, onClose }: ShipmentModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0B1020]/70 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-[#0B1020]">
              Create Shipment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter logistics and cargo details for global freight assignment.
            </p>
          </div>

          <button
            type="button"
            id="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body: Phase 4 Shell Structure */}
        <div className="px-6 py-6 overflow-y-auto space-y-5 text-sm">
          {/* Phase 5 Notice Alert */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#503BFF]/10 text-[#503BFF] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-xs text-indigo-950 uppercase tracking-wide">
                Phase 4: Modal Entry Point Shell
              </p>
              <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                Full form inputs, cargo metric calculators, validation logic, and PostgreSQL database insertion will be implemented in <strong>Phase 5 (Shipment CRUD)</strong>.
              </p>
            </div>
          </div>

          {/* Form Fields Preview Outline */}
          <div className="space-y-4 pt-1 opacity-70">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Origin Region
                </label>
                <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs text-slate-400">
                  Select origin (USA, UK, Germany, Walmart US)...
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Invoice Number
                </label>
                <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs text-slate-400 font-mono">
                  e.g. INV-2026-9001
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Total Boxes
                </label>
                <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs text-slate-400 font-mono">
                  0
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Weight (kg)
                </label>
                <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs text-slate-400 font-mono">
                  0.0 kg
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Volume (CBM)
                </label>
                <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs text-slate-400 font-mono">
                  0.00 CBM
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                FBA ID / Destination Warehouse
              </label>
              <div className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs text-slate-400 font-mono">
                e.g. FBA18ZK99 / DFW7
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            id="modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="modal-save-record-btn"
            disabled
            title="Form persistence will be enabled in Phase 5"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#503BFF]/60 cursor-not-allowed rounded-lg shadow-xs"
          >
            Save Record (Phase 5)
          </button>
        </div>
      </div>
    </div>
  );
}
