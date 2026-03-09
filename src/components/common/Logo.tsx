import type React from "react";
import { Link } from "react-router-dom";
import { brand } from "../../config/brand";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = "md", className }) => {
  const iconSize = size === "sm" ? "h-7 w-7 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";

  return (
    <Link to="/dashboard" className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <div className={`flex items-center justify-center rounded-lg bg-brand-primary font-semibold text-text-inverse ${iconSize}`}>
        {brand.logoFallback}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-text-primary">{brand.name}</span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-text-muted">{brand.tagline}</span>
      </div>
    </Link>
  );
};
