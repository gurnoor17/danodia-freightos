'use client';

import React from 'react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
  className?: string;
}

export function Alert({ type, message, className = '' }: AlertProps) {
  if (!message) return null;

  const styles = {
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: (
        <svg className="w-5 h-5 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: (
        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      container: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      icon: (
        <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const selected = styles[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm ${selected.container} ${className}`}
    >
      {selected.icon}
      <div className="flex-1 leading-snug">{message}</div>
    </div>
  );
}
