'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShipmentRecord,
  CreateShipmentPayload,
  createShipment,
  updateShipment,
  ApiError,
} from '@/lib/api';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shipment: ShipmentRecord) => void;
  initialData?: ShipmentRecord | null;
}

const REGION_OPTIONS = ['USA', 'UK', 'Germany', 'Walmart US'];

export function ShipmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}: ShipmentModalProps) {
  const { token } = useAuth();

  const isEditMode = !!initialData;

  // Form State
  const [formData, setFormData] = useState({
    region: 'USA',
    assigned_manager: '',
    invoice_no: '',
    fba_id: '',
    container_no: '',
    number_of_boxes: '',
    total_weight_kg: '',
    volume_cbm: '',
    pickup_date: '',
    sailing_date: '',
    expected_eta: '',
    actual_arrival: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when opening or when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          region: initialData.region || 'USA',
          assigned_manager: initialData.assigned_manager || '',
          invoice_no: initialData.invoice_no || '',
          fba_id: initialData.fba_id || '',
          container_no: initialData.container_no || '',
          number_of_boxes: String(initialData.number_of_boxes ?? ''),
          total_weight_kg: String(initialData.total_weight_kg ?? ''),
          volume_cbm: String(initialData.volume_cbm ?? ''),
          pickup_date: initialData.pickup_date || '',
          sailing_date: initialData.sailing_date || '',
          expected_eta: initialData.expected_eta || '',
          actual_arrival: initialData.actual_arrival || '',
        });
      } else {
        // Defaults for new shipment
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          region: 'USA',
          assigned_manager: '',
          invoice_no: '',
          fba_id: '',
          container_no: '',
          number_of_boxes: '',
          total_weight_kg: '',
          volume_cbm: '',
          pickup_date: today,
          sailing_date: '',
          expected_eta: '',
          actual_arrival: '',
        });
      }
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.region.trim()) {
      newErrors.region = 'Origin / Region is required';
    }
    if (!formData.assigned_manager.trim()) {
      newErrors.assigned_manager = 'Assigned manager is required';
    }
    if (!formData.invoice_no.trim()) {
      newErrors.invoice_no = 'Invoice number is required';
    }
    if (!formData.container_no.trim()) {
      newErrors.container_no = 'Container number is required';
    }

    // Cargo Metrics
    if (formData.number_of_boxes === '' || isNaN(Number(formData.number_of_boxes))) {
      newErrors.number_of_boxes = 'Number of boxes is required';
    } else if (Number(formData.number_of_boxes) < 0) {
      newErrors.number_of_boxes = 'Boxes cannot be negative';
    }

    if (formData.total_weight_kg === '' || isNaN(Number(formData.total_weight_kg))) {
      newErrors.total_weight_kg = 'Total weight is required';
    } else if (Number(formData.total_weight_kg) < 0) {
      newErrors.total_weight_kg = 'Weight cannot be negative';
    }

    if (formData.volume_cbm === '' || isNaN(Number(formData.volume_cbm))) {
      newErrors.volume_cbm = 'Volume is required';
    } else if (Number(formData.volume_cbm) < 0) {
      newErrors.volume_cbm = 'Volume cannot be negative';
    }

    // Dates
    if (!formData.pickup_date) {
      newErrors.pickup_date = 'Pickup date is required';
    }
    if (!formData.sailing_date) {
      newErrors.sailing_date = 'Sailing date is required';
    } else if (formData.pickup_date && new Date(formData.sailing_date) < new Date(formData.pickup_date)) {
      newErrors.sailing_date = 'Sailing date cannot precede pickup date';
    }

    if (!formData.expected_eta) {
      newErrors.expected_eta = 'Expected ETA is required';
    } else if (formData.sailing_date && new Date(formData.expected_eta) < new Date(formData.sailing_date)) {
      newErrors.expected_eta = 'Expected ETA cannot precede sailing date';
    }

    if (formData.actual_arrival && formData.pickup_date) {
      if (new Date(formData.actual_arrival) < new Date(formData.pickup_date)) {
        newErrors.actual_arrival = 'Actual arrival cannot precede pickup date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      setGeneralError('Authentication session not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    const payload: CreateShipmentPayload = {
      region: formData.region,
      category: formData.region,
      assigned_manager: formData.assigned_manager.trim(),
      invoice_no: formData.invoice_no.trim(),
      fba_id: formData.fba_id.trim() || null,
      container_no: formData.container_no.trim(),
      number_of_boxes: parseInt(formData.number_of_boxes, 10),
      total_weight_kg: parseFloat(formData.total_weight_kg),
      volume_cbm: parseFloat(formData.volume_cbm),
      pickup_date: formData.pickup_date,
      sailing_date: formData.sailing_date,
      expected_eta: formData.expected_eta,
      actual_arrival: formData.actual_arrival ? formData.actual_arrival : null,
    };

    try {
      let saved: ShipmentRecord;
      if (isEditMode && initialData) {
        saved = await updateShipment(token, initialData.id, payload);
      } else {
        saved = await createShipment(token, payload);
      }
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        if (err.errors && Array.isArray(err.errors)) {
          // Map backend Joi validation errors if available
          const fieldErrors: Record<string, string> = {};
          for (const msg of err.errors) {
            if (msg.includes('sailing_date') || msg.includes('Sailing date')) fieldErrors.sailing_date = msg;
            else if (msg.includes('expected_eta') || msg.includes('Expected ETA')) fieldErrors.expected_eta = msg;
            else if (msg.includes('pickup_date') || msg.includes('Pickup date')) fieldErrors.pickup_date = msg;
            else if (msg.includes('boxes')) fieldErrors.number_of_boxes = msg;
            else if (msg.includes('weight')) fieldErrors.total_weight_kg = msg;
            else if (msg.includes('volume')) fieldErrors.volume_cbm = msg;
          }
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      } else {
        setGeneralError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <div
        onClick={() => !isSubmitting && onClose()}
        className="fixed inset-0 bg-[#0B1020]/75 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-[#0B1020]">
              {isEditMode ? `Edit Shipment (${formData.invoice_no || 'Record'})` : 'Create New Shipment'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter logistics and cargo details for global freight assignment.
            </p>
          </div>

          <button
            type="button"
            id="modal-close-icon-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form id="shipment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          {generalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          {/* Section 1 — Consignment Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-md bg-[#503BFF]/10 text-[#503BFF] flex items-center justify-center font-bold text-[11px]">
                01
              </span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Consignment Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Region / Category */}
              <div>
                <label htmlFor="field-region" className="block text-xs font-semibold text-slate-700 mb-1">
                  Region / Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="field-region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all"
                >
                  {REGION_OPTIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="text-[11px] text-rose-600 mt-1">{errors.region}</p>}
              </div>

              {/* Assigned Manager */}
              <div>
                <label htmlFor="field-manager" className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Manager <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="field-manager"
                  name="assigned_manager"
                  placeholder="e.g. Marcus Sterling"
                  value={formData.assigned_manager}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-[#0B1020] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.assigned_manager ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.assigned_manager && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.assigned_manager}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Invoice No. */}
              <div>
                <label htmlFor="field-invoice" className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="field-invoice"
                  name="invoice_no"
                  placeholder="INV-2026-001"
                  value={formData.invoice_no}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.invoice_no ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.invoice_no && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.invoice_no}</p>
                )}
              </div>

              {/* FBA ID */}
              <div>
                <label htmlFor="field-fba" className="block text-xs font-semibold text-slate-700 mb-1">
                  FBA ID (Amazon) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="field-fba"
                  name="fba_id"
                  placeholder="FBA18ZK99"
                  value={formData.fba_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-[#0B1020] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all"
                />
              </div>

              {/* Container No. */}
              <div>
                <label htmlFor="field-container" className="block text-xs font-semibold text-slate-700 mb-1">
                  Container No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="field-container"
                  name="container_no"
                  placeholder="MSKU-98214-0"
                  value={formData.container_no}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.container_no ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.container_no && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.container_no}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2 — Cargo Metrics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-md bg-[#503BFF]/10 text-[#503BFF] flex items-center justify-center font-bold text-[11px]">
                02
              </span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Cargo Metrics
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Number of Boxes */}
              <div>
                <label htmlFor="field-boxes" className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Boxes <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="field-boxes"
                  name="number_of_boxes"
                  min="0"
                  placeholder="0"
                  value={formData.number_of_boxes}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.number_of_boxes ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.number_of_boxes && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.number_of_boxes}</p>
                )}
              </div>

              {/* Total Weight */}
              <div>
                <label htmlFor="field-weight" className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Weight (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="field-weight"
                  name="total_weight_kg"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.total_weight_kg}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.total_weight_kg ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.total_weight_kg && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.total_weight_kg}</p>
                )}
              </div>

              {/* Volume CBM */}
              <div>
                <label htmlFor="field-volume" className="block text-xs font-semibold text-slate-700 mb-1">
                  Volume (CBM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="field-volume"
                  name="volume_cbm"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.volume_cbm}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.volume_cbm ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.volume_cbm && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.volume_cbm}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3 — Logistics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-md bg-[#503BFF]/10 text-[#503BFF] flex items-center justify-center font-bold text-[11px]">
                03
              </span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Logistics Dates
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup Date */}
              <div>
                <label htmlFor="field-pickup" className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="field-pickup"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.pickup_date ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.pickup_date && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.pickup_date}</p>
                )}
              </div>

              {/* Sailing Date */}
              <div>
                <label htmlFor="field-sailing" className="block text-xs font-semibold text-slate-700 mb-1">
                  Sailing Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="field-sailing"
                  name="sailing_date"
                  value={formData.sailing_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.sailing_date ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.sailing_date && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.sailing_date}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expected ETA */}
              <div>
                <label htmlFor="field-eta" className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected ETA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  id="field-eta"
                  name="expected_eta"
                  value={formData.expected_eta}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.expected_eta ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.expected_eta && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.expected_eta}</p>
                )}
              </div>

              {/* Actual Arrival */}
              <div>
                <label htmlFor="field-arrival" className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Arrival <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  id="field-arrival"
                  name="actual_arrival"
                  value={formData.actual_arrival}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono text-[#0B1020] focus:outline-none focus:ring-2 focus:ring-[#503BFF]/20 focus:border-[#503BFF] transition-all ${
                    errors.actual_arrival ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.actual_arrival && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.actual_arrival}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
          <button
            type="button"
            id="modal-cancel-btn"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="shipment-form"
            id="modal-save-record-btn"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#503BFF] hover:bg-[#432fe0] active:bg-[#3826c7] rounded-lg shadow-sm shadow-[#503BFF]/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Record' : '+ Save Record'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
