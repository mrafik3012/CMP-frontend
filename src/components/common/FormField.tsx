// MODIFIED: 2026-03-03 - Added FormField wrapper for labels, hints, and errors

import type React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  hint,
  children,
}) => {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">
        <span>{label}</span>
        {required && <span className="ml-0.5 text-status-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-status-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
};

