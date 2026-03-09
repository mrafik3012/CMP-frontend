import { useMemo } from "react";
import { formatCurrency } from "../../utils/format";

interface BudgetItem {
  estimated_cost: number;
  actual_cost?: number | null;
  gst_rate?: number;
  gst_amount?: number;
}

interface Props {
  items: BudgetItem[];
}

export function GSTSummaryCard({ items }: Props) {
  const summary = useMemo(() => {
    const baseEstimated = items.reduce((s, i) => s + (i.estimated_cost ?? 0), 0);
    const baseActual = items.reduce((s, i) => s + (i.actual_cost ?? 0), 0);
    const totalGST = items.reduce((s, i) => s + (i.gst_amount ?? ((i.estimated_cost ?? 0) * (i.gst_rate ?? 0) / 100)), 0);
    return { baseEstimated, baseActual, totalGST, grandTotal: baseEstimated + totalGST };
  }, [items]);

  return (
    <div className="rounded-xl border border-border-default bg-surface-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">GST Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Base Estimated</span>
          <span className="font-medium text-text-primary">{formatCurrency(summary.baseEstimated)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Base Actual</span>
          <span className="font-medium text-text-primary">{formatCurrency(summary.baseActual)}</span>
        </div>
        <div className="flex justify-between text-status-warning">
          <span>Total GST</span>
          <span className="font-medium">{formatCurrency(summary.totalGST)}</span>
        </div>
        <div className="flex justify-between border-t border-border-default pt-2">
          <span className="font-semibold text-text-primary">Grand Total (incl. GST)</span>
          <span className="font-bold text-brand-primary">{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
