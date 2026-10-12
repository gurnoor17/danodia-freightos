'use client';

import React from 'react';
import { ShipmentItem } from '@/lib/dashboard/mock-data';

interface ShipmentResultsProps {
  shipments: ShipmentItem[];
  onOpenAddShipment: () => void;
}

export function ShipmentResults({ shipments, onOpenAddShipment }: ShipmentResultsProps) {
  // Aggregate metrics
  const totalBoxes = shipments.reduce((acc, curr) => acc + curr.boxes, 0);
  const totalWeight = shipments.reduce((acc, curr) => acc + curr.weightKg, 0);
  const totalVolume = shipments.reduce((acc, curr) => acc + curr.volumeCbm, 0);

  const getStatusBadge = (status: ShipmentItem['status']) => {
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

      {/* Content Area: Empty State vs Horizontally Scrollable Table Placeholder */}
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
        /* Populated Table Placeholder */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Invoice & FBA</th>
                <th className="py-3 px-4">Region / Route</th>
                <th className="py-3 px-4">Cargo Manager</th>
                <th className="py-3 px-4">Cargo Metrics</th>
                <th className="py-3 px-4">Logistics Dates</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Invoice & FBA */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-bold text-[#0B1020]">{shipment.invoiceNo}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{shipment.fbaId}</div>
                  </td>

                  {/* Region / Route */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#503BFF]"></span>
                      <span>{shipment.origin}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                      {shipment.destination}
                    </div>
                  </td>

                  {/* Manager */}
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium">{shipment.manager}</div>
                  </td>

                  {/* Cargo Metrics */}
                  <td className="py-3.5 px-4 font-mono">
                    <div className="text-slate-800 font-semibold">{shipment.boxes} boxes</div>
                    <div className="text-[11px] text-slate-400">
                      {shipment.weightKg.toLocaleString()} kg · {shipment.volumeCbm} CBM
                    </div>
                  </td>

                  {/* Logistics Dates */}
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    <div>Dep: {shipment.departureDate}</div>
                    <div className="text-slate-400">Est: {shipment.estimatedArrival}</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
