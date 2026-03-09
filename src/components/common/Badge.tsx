// MODIFIED: 2026-03-03 - Added status and priority badge component

import type React from "react";

interface BadgeProps {
  status?: string;
  priority?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, priority }) => {
  if (!status && !priority) return null;

  let text = status ?? priority ?? "";
  let className =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";
  let dotClass = "";

  if (status) {
    const normalized = status.toLowerCase();
    if (["done", "active"].includes(normalized)) {
      className += " text-status-success bg-status-success/15";
    } else if (normalized === "in progress") {
      className += " text-status-warning bg-status-warning/15";
    } else if (normalized === "blocked") {
      className += " text-status-error bg-status-error/15";
    } else if (["on hold", "pending"].includes(normalized)) {
      className += " text-status-warning bg-status-warning/15";
    } else if (normalized === "planning") {
      className += " text-accent-secondary bg-accent-secondary/10";
    } else if (["inactive", "cancelled"].includes(normalized)) {
      className += " text-text-muted bg-surface-elevated";
    } else {
      className += " text-text-secondary bg-surface-elevated";
    }
  } else if (priority) {
    const normalized = priority.toLowerCase();
    if (normalized === "critical") {
      className += " text-status-error bg-status-error/15";
      dotClass =
        "h-1.5 w-1.5 rounded-full bg-status-error animate-pulse";
    } else if (normalized === "high") {
      className += " text-status-warning bg-status-warning/15";
    } else if (normalized === "medium") {
      className += " text-accent-secondary bg-accent-secondary/15";
    } else if (normalized === "low") {
      className += " text-text-muted bg-surface-elevated";
    } else {
      className += " text-text-secondary bg-surface-elevated";
    }
  }

  return (
    <span className={className}>
      {dotClass && <span className={dotClass} />}
      <span>{text}</span>
    </span>
  );
};

