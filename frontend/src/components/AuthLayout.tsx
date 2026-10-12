'use client';

import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerPrompt: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Danodia FreightOS Branding Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-2">
            {/* Cargo / Container Ship Logistics Icon */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-indigo-700">
            <span>Danodia FreightOS</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Logistics Cloud</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-md shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {children}

          {/* Footer Link Navigation */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            {footerPrompt}{' '}
            <Link
              href={footerLinkHref}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
            >
              {footerLinkText}
            </Link>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Shipment Manager • Enterprise Grade Security
        </p>
      </div>
    </div>
  );
}
