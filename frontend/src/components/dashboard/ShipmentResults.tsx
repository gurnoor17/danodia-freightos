'use client';

import React from 'react';
import { ShipmentRecord } from '@/lib/api';

interface ShipmentResultsProps {
  shipments: ShipmentRecord[];
  summaryTotals?: {
    totalBoxes: number;
    totalWeightKg: number;
    totalVolumeCbm: number;
  };
  onOpenAddShipment: () => void;
  onEditShipment?: (shipment: ShipmentRecord) => void;
  onDeleteShipment?: (shipment: ShipmentRecord) => void;
  isDeletingId?: string | null;
}

export function ShipmentResults({
  shipments,
  summaryTotals,
  onOpenAddShipment,
  onEditShipment,
  onDeleteShipment,
  isDeletingId,
}: ShipmentResultsProps) {
  // Aggregate metrics from prop or local calculation
  const totalBoxes = summaryTotals
    ? summaryTotals.totalBoxes
    : shipments.reduce((acc, curr) => acc + (curr.number_of_boxes || 0), 0);

  const totalWeight = summaryTotals
    ? summaryTotals.totalWeightKg
    : shipments.reduce((acc, curr) => acc + (curr.total_weight_kg || 0), 0);

  const totalVolume = summaryTotals
    ? summaryTotals.totalVolumeCbm
    : shipments.reduce((acc, curr) => acc + (curr.volume_cbm || 0), 0);

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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Metric Summary Header Bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#0B1020]">
            {shipments.length} {shipments.length === 1 ? 'Shipment' : 'Shipments'}
          </span>
          <span className="text-xs text-slate-400">found</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Boxes:</span>
            <span className="font-bold text-[#0B1020] font-mono">{totalBoxes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Weight:</span>
            <span className="font-bold text-[#0B1020] font-mono">
              {totalWeight.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Volume:</span>
            <span className="font-bold text-[#0B1020] font-mono">
              {totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CBM
            </span>
          </div>
        </div>
      </div>

      {/* Content Area: Empty State vs Live Data Table */}
      {shipments.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 border border-indigo-100/80 flex items-center justify-center text-[#503BFF] shadow-xs mb-4">
            {/* Package / Shipping Box Icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-[#0B1020] tracking-tight">
            No shipments found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
            Create a new shipment or adjust your search filters to see data.
          </p>

          <button
            type="button"
            id="empty-add-shipment-btn"
            onClick={onOpenAddShipment}
            className="inline-flex items-center gap-2 bg-[#503BFF] hover:bg-[#432fe0] active:bg-[#3826c7] text-white font-semibold text-sm py-2.5 px-5 rounded-xl shadow-md shadow-[#503BFF]/25 transition-all duration-150 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Shipment</span>
          </button>
        </div>
      ) : (
        /* Populated Live Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Invoice & FBA</th>
                <th className="py-3 px-4">Origin / Container</th>
                <th className="py-3 px-4">Assigned Manager</th>
                <th className="py-3 px-4">Cargo Metrics</th>
                <th className="py-3 px-4">Logistics Dates</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50/60 transition-colors">
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
                    <div className="font-medium">{shipment.assigned_manager}</div>
                  </td>

                  {/* Cargo Metrics */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="text-slate-800 font-semibold">{shipment.number_of_boxes} boxes</div>
                    <div className="text-[11px] text-slate-400">
                      {Number(shipment.total_weight_kg).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg · {Number(shipment.volume_cbm).toFixed(2)} CBM
                    </div>
                  </td>

                  {/* Logistics Dates */}
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    <div>Pickup: {shipment.pickup_date}</div>
                    <div>Sailing: {shipment.sailing_date}</div>
                    <div className="text-slate-400">ETA: {shipment.expected_eta}</div>
                    {shipment.actual_arrival && (
                      <div className="text-emerald-600 font-semibold">Arrived: {shipment.actual_arrival}</div>
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

                  {/* Actions (Edit & Delete) */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {onEditShipment && (
                        <button
                          type="button"
                          onClick={() => onEditShipment(shipment)}
                          title="Edit Shipment"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#503BFF] hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {onDeleteShipment && (
                        <button
                          type="button"
                          onClick={() => onDeleteShipment(shipment)}
                          disabled={isDeletingId === shipment.id}
                          title="Delete Shipment"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingId === shipment.id ? (
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
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
