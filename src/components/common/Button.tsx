// MODIFIED: 2026-03-03 - Added reusable Button component with variants, sizes, and loading state

import type React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "icon";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary disabled:cursor-not-allowed";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-accent-primary text-text-inverse hover:bg-accent-primaryHover active:bg-accent-primaryActive active:scale-[0.98]",
    secondary:
      "bg-surface-elevated border border-surface-border text-text-primary hover:bg-surface-hover",
    danger:
      "border border-status-error text-status-error hover:bg-status-error/10",
    ghost:
      "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
    icon: "w-8 h-8 flex items-center justify-center hover:bg-surface-hover rounded-md text-text-secondary hover:text-text-primary",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type="button"
      {...rest}
      disabled={isDisabled}
      className={classNames(
        base,
        variant !== "icon" && sizes[size],
        variants[variant],
        isDisabled && "opacity-70",
        className
      )}
    >
      {isLoading && (
        <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-accent-secondary border-t-transparent" />
      )}
      {children}
    </button>
  );
};

