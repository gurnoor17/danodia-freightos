'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal?: () => void;
  activeItem?: 'dashboard' | 'analytics' | 'watchlist';
  shipmentCount?: number;
  watchlistCount?: number;
}

export function Sidebar({
  isOpen,
  onClose,
  onOpenCreateModal,
  activeItem = 'dashboard',
  shipmentCount = 0,
  watchlistCount = 0,
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B1020] text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-[#1B233D]`}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-[#503BFF] text-white flex items-center justify-center shadow-md shadow-[#503BFF]/30 group-hover:scale-105 transition-transform">
                {/* Freight Container Ship Logo */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base leading-none tracking-tight">
                  Danodia FreightOS
                </span>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-wider uppercase">
                  Global Logistics
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Workspace Switcher */}
          <div className="bg-[#12192E] border border-[#1E294B] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                DG
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  Danodia Global Exports
                </span>
                <span className="text-[10px] text-slate-400">Default Workspace</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Primary Action: + Create Shipment */}
          <div>
            {onOpenCreateModal ? (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="w-full flex items-center justify-center gap-2 bg-[#503BFF] hover:bg-[#432fe0] active:bg-[#3826c7] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-[#503BFF]/25 transition-all duration-150 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Create Shipment</span>
              </button>
            ) : (
              <Link
                href="/dashboard?create=true"
                className="w-full flex items-center justify-center gap-2 bg-[#503BFF] hover:bg-[#432fe0] active:bg-[#3826c7] text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-md shadow-[#503BFF]/25 transition-all duration-150 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Create Shipment</span>
              </Link>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-1">
            {/* Dashboard Navigation Item */}
            <Link
              href="/dashboard"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeItem === 'dashboard'
                  ? 'bg-[#182240] text-white border-l-4 border-[#503BFF]'
                  : 'text-slate-400 hover:text-white hover:bg-[#12192E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 ${activeItem === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Dashboard</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#202D52] text-slate-300 font-mono">
                {shipmentCount}
              </span>
            </Link>

            {/* Analytics Navigation Item */}
            <Link
              href="/analytics"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeItem === 'analytics'
                  ? 'bg-[#182240] text-white border-l-4 border-[#503BFF]'
                  : 'text-slate-400 hover:text-white hover:bg-[#12192E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 ${activeItem === 'analytics' ? 'text-indigo-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Analytics</span>
              </div>
            </Link>

            {/* Saved Watchlist Navigation Item */}
            <Link
              href="/watchlist"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeItem === 'watchlist'
                  ? 'bg-[#182240] text-white border-l-4 border-[#503BFF]'
                  : 'text-slate-400 hover:text-white hover:bg-[#12192E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 ${activeItem === 'watchlist' ? 'text-amber-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <span>Saved Watchlist</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                watchlistCount > 0 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'bg-[#182038] text-slate-400'
              }`}>
                {watchlistCount}
              </span>
            </Link>
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-4 border-t border-[#1B233D] bg-[#080D1A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Authenticated User'}
                </span>
                <span className="text-[11px] text-slate-400 truncate">Settings</span>
              </div>
            </div>

            {/* Logout Icon Button */}
            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
