/**
 * Project budget page: budget items list + summary cards + add/edit/delete.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { budgetApi } from "../../api/client";
import { useToast } from "../../components/common/Toast";
import { useAuthStore } from "../../stores/authStore";

const CATEGORIES = ["Labour", "Materials", "Equipment", "Subcontractor", "Overheads", "Contingency"];
const INPUT =
  "w-full rounded-md border border-border-default px-3 py-2 text-sm text-text-primary bg-surface-card placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/40";
const LABEL =
  "mb-1 block text-sm font-medium text-text-secondary";

interface BudgetForm {
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
}

const toNum = (v: unknown): number => (typeof v === "number" && !Number.isNaN(v) ? v : 0);

const CATEGORY_COLOR: Record<string, string> = {
  Labour: "bg-accent-secondary/15 text-accent-secondary",
  Materials: "bg-status-success/15 text-status-success",
  Equipment: "bg-status-warning/15 text-status-warning",
  Subcontractor: "bg-status-error/15 text-status-error",
  Overheads: "bg-background-primary/80 text-text-muted",
  Contingency: "bg-status-warning/15 text-status-warning",
};

export function ProjectBudgetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "Admin" || user?.role === "Project Manager";

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["budget", pid],
    enabled: Number.isFinite(pid),
    queryFn: () => budgetApi.list(pid).then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ["budget-summary", pid],
    enabled: Number.isFinite(pid),
    queryFn: () => budgetApi.summary(pid).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetForm>();

  const openAdd = () => {
    setEditingItem(null);
    reset({
      category: "Labour",
      description: "",
      estimated_cost: "" as unknown as number,
      actual_cost: "" as unknown as number,
    });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    reset({
      category: item.category,
      description: item.description ?? "",
      estimated_cost: item.estimated_cost,
      actual_cost: item.actual_cost,
    });
    setShowModal(true);
  };

  type SavePayload = BudgetForm & { editingItemId?: number | null };
  const saveMutation = useMutation({
    mutationFn: (payload: SavePayload) => {
      const { editingItemId, ...formData } = payload;
      const data = {
        ...formData,
        estimated_cost: toNum(formData.estimated_cost),
        actual_cost: toNum(formData.actual_cost),
      };
      return editingItemId != null
        ? budgetApi.update(editingItemId, data).then((r) => r.data)
        : budgetApi.create(pid, data).then((r) => r.data);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["budget", pid] });
      qc.invalidateQueries({ queryKey: ["budget-summary", pid] });
      toastSuccess(variables.editingItemId != null ? "Item updated" : "Item added");
      setShowModal(false);
      setEditingItem(null);
      reset();
    },
    onError: () => toastError("Failed to save item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget", pid] });
      qc.invalidateQueries({ queryKey: ["budget-summary", pid] });
      toastSuccess("Item deleted");
    },
    onError: () => toastError("Failed to delete item"),
  });

  const handleExport = async () => {
    try {
      const res = await budgetApi.exportCsv(pid);
      const url = window.URL.createObjectURL(new Blob([res.data as any]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-project-${pid}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("CSV exported");
    } catch {
      toastError("Export failed");
    }
  };

  if (!Number.isFinite(pid))
    return <p className="p-6 text-status-error">Invalid project ID.</p>;
  if (isLoading)
    return <p className="p-6 text-text-secondary">Loading budget...</p>;
  if (error)
    return <p className="p-6 text-status-error">Error loading budget.</p>;

  const totalEstimated = summary?.estimated?.reduce((a: number, b: number) => a + b, 0) ?? 0;
  const totalActual    = summary?.actual?.reduce((a: number, b: number) => a + b, 0) ?? 0;
  const totalVariance  = totalEstimated - totalActual;
  const overBudget     = totalVariance < 0;

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Budget</h2>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="rounded border border-border-default px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover">
            ⬇ Export CSV
          </button>
          {canEdit && (
            <button onClick={openAdd}
              className="rounded bg-accent-primary px-4 py-2 text-sm text-text-inverse hover:bg-accent-primaryHover">
              + Add Item
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            Total Estimated
          </p>
          <p className="text-2xl font-bold text-accent-secondary">
            ₹{totalEstimated.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            Total Actual Spent
          </p>
          <p className="text-2xl font-bold text-status-success">
            ₹{totalActual.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <p
            className={`mb-1 text-xs font-medium uppercase tracking-wide ${
              overBudget ? "text-status-error" : "text-status-success"
            }`}
          >
            {overBudget ? "⚠ Over Budget" : "Variance (Savings)"}
          </p>
          <p
            className={`text-2xl font-bold ${
              overBudget ? "text-status-error" : "text-status-success"
            }`}
          >
            ₹{Math.abs(totalVariance).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Table */}
      {!items || items.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <p className="mb-2 text-4xl">💰</p>
          <p className="font-medium">No budget items yet</p>
          {canEdit && (
            <p className="mt-1 text-sm">
              Click <strong>+ Add Item</strong> to get started
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-background-primary/80">
              <tr>
                {["Category", "Description", "Estimated (₹)", "Actual (₹)", "Variance (₹)", ""].map(h => (
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
              {items.map((x: any) => {
                const variance = x.estimated_cost - x.actual_cost;
                return (
                  <tr key={x.id} className="border-t border-border-subtle hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          CATEGORY_COLOR[x.category] ??
                          "bg-background-primary/80 text-text-muted"
                        }`}
                      >
                        {x.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{x.description ?? "-"}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">
                      ₹{x.estimated_cost.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-text-primary font-medium">
                      ₹{x.actual_cost.toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        variance < 0 ? "text-status-error" : "text-status-success"
                      }`}
                    >
                      {variance < 0 ? "-" : "+"}₹{Math.abs(variance).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(x)}
                            className="text-xs text-accent-secondary hover:underline"
                          >
                            Edit
                          </button>
                          <button onClick={() => { if (confirm("Delete this item?")) deleteMutation.mutate(x.id); }}
                            className="text-xs text-status-error hover:underline">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Item dialog - conditional render so it unmounts when showModal is false */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border-default bg-surface-card p-6 text-text-primary shadow-modal">
            <h3 className="mb-4 text-lg font-semibold">
              {editingItem ? "Edit Budget Item" : "Add Budget Item"}
            </h3>
            <form
              onSubmit={handleSubmit((d) => {
                const payload: SavePayload = { ...d, editingItemId: editingItem?.id ?? null };
                saveMutation.mutate(payload);
              })}
              className="space-y-4"
            >
              <div>
                <label className={LABEL}>Category *</label>
                <select {...register("category", { required: true })} className={INPUT}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className={INPUT}
                  placeholder="What is this cost for?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Estimated Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter amount"
                    {...register("estimated_cost", {
                      required: "Estimated cost is required",
                      valueAsNumber: true,
                      validate: (v) =>
                        (typeof v === "number" && !Number.isNaN(v) && v > 0) ||
                        "Must be greater than 0",
                    })}
                    className={INPUT}
                  />
                  {errors.estimated_cost && (
                    <p className="mt-1 text-xs text-status-error">
                      {errors.estimated_cost.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={LABEL}>Actual Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("actual_cost", { valueAsNumber: true })}
                    className={INPUT}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-brand-primary text-white px-5 py-2 rounded text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    reset();
                  }}
                  className="border border-gray-300 px-5 py-2 rounded text-sm text-gray-700 bg-white hover:bg-gray-100"
                >
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