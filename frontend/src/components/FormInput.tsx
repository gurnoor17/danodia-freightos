'use client';

import React from 'react';

interface FormInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

export function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  autoComplete,
  rightElement,
}: FormInputProps) {
  const hasError = !!error;

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-baseline">
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label} {required && <span className="text-rose-500" title="Required field">*</span>}
        </label>
        {helperText && !hasError && (
          <span className="text-xs text-slate-400">{helperText}</span>
        )}
      </div>

      <div className="relative rounded-lg shadow-xs">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`block w-full rounded-lg px-3.5 py-2.5 text-sm bg-white text-slate-900 border transition-all duration-150 outline-none ${
            rightElement ? 'pr-11' : ''
          } ${
            hasError
              ? 'border-rose-400 text-rose-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : 'border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
          } ${disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-auto">
            {rightElement}
          </div>
        )}
      </div>

      {hasError && (
        <p id={`${id}-error`} role="alert" className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
