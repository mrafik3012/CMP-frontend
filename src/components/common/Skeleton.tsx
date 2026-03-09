// MODIFIED: 2026-03-03 - Added skeleton loading components for tables, cards, and grids

import type React from "react";

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <div className="skeleton h-4 w-3/4 rounded-md bg-surface-card" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton rounded-xl border border-border-subtle bg-surface-card/80 p-4 shadow-card" />
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

