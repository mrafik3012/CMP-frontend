// MODIFIED: 2026-03-03 - Added reusable confirmation dialog built on Modal

import type React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { IconAlertTriangle } from "../icons";

type ConfirmVariant = "danger" | "warning";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: ConfirmVariant;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading = false,
  variant = "danger",
}) => {
  const iconColor =
    variant === "danger" ? "text-status-danger" : "text-status-warning";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${iconColor}`}>
          <IconAlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "secondary"}
              size="sm"
              type="button"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

