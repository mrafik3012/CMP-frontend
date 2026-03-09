/**
 * Project change orders page: list + create form.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { budgetApi } from "../../api/client";
import { useToast } from "../../components/common/Toast";
import { useAuthStore } from "../../stores/authStore";
import type { ChangeOrder } from "../../types-budget";

const INPUT =
  "w-full rounded-md border border-border-default px-3 py-2 text-sm text-text-primary bg-surface-card placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/40";
const LABEL =
  "mb-1 block text-sm font-medium text-text-secondary";

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-status-warning/15 text-status-warning",
  Approved: "bg-status-success/15 text-status-success",
  Rejected: "bg-status-error/15 text-status-error",
};

interface COForm {
  description: string;
  cost_impact: number;
  justification: string;
}

export function ProjectChangeOrdersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "Admin" || user?.role === "Project Manager";

  const [showModal, setShowModal] = useState(false);

  const { data: list, isLoading, error } = useQuery({
    queryKey: ["change-orders", pid],
    enabled: Number.isFinite(pid),
    queryFn: () => budgetApi.changeOrderList(pid).then(r => r.data as ChangeOrder[]),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<COForm>();

  const createMutation = useMutation({
    mutationFn: (data: COForm) =>
      budgetApi.changeOrderCreate(pid, { ...data, cost_impact: Number(data.cost_impact) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["change-orders", pid] });
      toastSuccess("Change order created");
      setShowModal(false);
      reset();
    },
    onError: () => toastError("Failed to create change order"),
  });

  if (!Number.isFinite(pid))
    return <p className="p-6 text-status-error">Invalid project ID.</p>;
  if (isLoading)
    return (
      <p className="p-6 text-text-secondary">
        Loading change orders...
      </p>
    );
  if (error)
    return <p className="p-6 text-status-error">Error loading change orders.</p>;

  const totalImpact = list?.reduce((a, co) => a + (co.cost_impact ?? 0), 0) ?? 0;
  const pending  = list?.filter(co => co.status === "Pending").length ?? 0;
  const approved = list?.filter(co => co.status === "Approved").length ?? 0;

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Change Orders</h2>
        {canEdit && (
          <button onClick={() => { reset(); setShowModal(true); }}
            className="rounded bg-accent-primary px-4 py-2 text-sm text-text-inverse hover:bg-accent-primaryHover">
            + New Change Order
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-status-warning">
            Pending
          </p>
          <p className="text-2xl font-bold text-status-warning">{pending}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-status-success">
            Approved
          </p>
          <p className="text-2xl font-bold text-status-success">{approved}</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent-secondary">
            Total Cost Impact
          </p>
          <p className="text-2xl font-bold text-accent-secondary">₹{totalImpact.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Table */}
      {!list || list.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <p className="mb-2 text-4xl">📝</p>
          <p className="font-medium">No change orders yet</p>
          {canEdit && (
            <p className="mt-1 text-sm">
              Click <strong>+ New Change Order</strong> to create one
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-background-primary/80">
              <tr>
                {["#", "Description", "Cost Impact (₹)", "Justification", "Status"].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((co) => (
                <tr
                  key={co.id}
                  className="border-t border-border-subtle hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {co.change_order_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {co.description}
                  </td>
                  <td className="px-4 py-3 font-medium text-status-warning">
                    ₹{co.cost_impact.toLocaleString("en-IN")}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-text-secondary">
                    {co.justification ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[co.status] ??
                        "bg-background-primary/80 text-text-muted"
                      }`}
                    >
                      {co.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border-default bg-surface-card p-6 text-text-primary shadow-modal">
            <h3 className="mb-4 text-lg font-semibold">New Change Order</h3>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className={LABEL}>Description *</label>
                <textarea {...register("description", { required: "Required" })} rows={3}
                  className={INPUT} placeholder="What is changing and why?" />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <label className={LABEL}>Cost Impact (₹) *</label>
                <input type="number" step="0.01"
                  {...register("cost_impact", { required: "Required", valueAsNumber: true })}
                  className={INPUT} placeholder="0.00" />
                {errors.cost_impact && <p className="text-red-500 text-xs mt-1">{errors.cost_impact.message}</p>}
              </div>
              <div>
                <label className={LABEL}>Justification *</label>
                <textarea {...register("justification", { required: "Required" })} rows={3}
                  className={INPUT} placeholder="Business reason for this change" />
                {errors.justification && <p className="text-red-500 text-xs mt-1">{errors.justification.message}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={createMutation.isPending}
                  className="bg-brand-primary text-white px-5 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50">
                  {createMutation.isPending ? "Submitting..." : "Submit Change Order"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="border border-gray-300 px-5 py-2 rounded text-sm text-gray-700 bg-white hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}