// MODIFIED: 2026-03-03 - Added styled Input component with left/right adornments and error state

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftIcon, rightElement, className, ...rest }, ref) => {
    const base =
      "h-10 w-full rounded-md border bg-surface-base px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors duration-150";

    const errorClass = error ? "border-status-danger" : "border-surface-border";
    const leftPadding = leftIcon ? "pl-9" : "";
    const rightPadding = rightElement ? "pr-9" : "";

    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`${base} ${errorClass} ${leftPadding} ${rightPadding} ${className ?? ""}`}
          {...rest}
        />
        {rightElement && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-text-muted">
            {rightElement}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

