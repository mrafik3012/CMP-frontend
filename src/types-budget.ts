// Narrow type for change orders used only by budget-related pages.

export interface ChangeOrder {
  id: number;
  project_id: number;
  change_order_number: number;
  description: string;
  cost_impact: number;
  justification: string;
  requested_by: number;
  approved_by?: number | null;
  status: string;
  created_at: string;
  approved_at?: string | null;
}

