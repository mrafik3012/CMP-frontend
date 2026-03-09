// MODIFIED: 2026-03-03 - Added global toast provider and useToast hook

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconX } from "../icons";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdCounter = 1;

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; iconColor: string; defaultDuration: number }
> = {
  success: {
    border: "border-status-success",
    iconColor: "text-status-success",
    defaultDuration: 3000,
  },
  error: {
    border: "border-status-error",
    iconColor: "text-status-error",
    defaultDuration: 5000,
  },
  info: {
    border: "border-accent-secondary",
    iconColor: "text-accent-secondary",
    defaultDuration: 3000,
  },
  warning: {
    border: "border-status-warning",
    iconColor: "text-status-warning",
    defaultDuration: 3000,
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, message: string) => {
      setToasts((prev) => {
        const id = toastIdCounter++;
        const config = VARIANT_STYLES[variant];
        const next: Toast = {
          id,
          message,
          variant,
          duration: config.defaultDuration,
        };
        const all = [...prev, next];
        return all.slice(-3);
      });
    },
    []
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        remove(toast.id);
      }, toast.duration)
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, remove]);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => addToast("success", message),
      error: (message: string) => addToast("error", message),
      info: (message: string) => addToast("info", message),
      warning: (message: string) => addToast("warning", message),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
          {toasts.map((toast) => {
            const styles = VARIANT_STYLES[toast.variant];
            return (
              <div
                key={toast.id}
                className={`animate-fadeSlideUp flex items-start gap-3 rounded-lg border-l-4 ${styles.border} bg-surface-elevated px-4 py-3 shadow-card`}
              >
                <div className={`mt-0.5 ${styles.iconColor}`}>
                  {toast.variant === "success" ? (
                    <IconCheck className="h-5 w-5" />
                  ) : toast.variant === "error" ? (
                    <IconX className="h-5 w-5" />
                  ) : (
                    <span className="text-lg leading-none">
                      {toast.variant === "info" ? "i" : "!"}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-sm text-text-primary">{toast.message}</div>
                <button
                  type="button"
                  onClick={() => remove(toast.id)}
                  className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  aria-label="Dismiss"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

