// MODIFIED: 2026-03-03 - Added reusable Modal component using React portal

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { IconX } from "../icons";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass =
    size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg";

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={`mx-4 w-full rounded-2xl border border-surface-border bg-surface-elevated shadow-modal animate-fadeSlideUp ${sizeClass}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[90vh] overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

