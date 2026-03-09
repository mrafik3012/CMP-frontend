// MODIFIED: 2026-03-03 - Added reusable EmptyState component

import type React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  "data-testid"?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  "data-testid": dataTestId,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid={dataTestId}
    >
      {icon && (
        <div className="mb-4 text-text-muted [&>*]:h-12 [&>*]:w-12">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-text-secondary">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

