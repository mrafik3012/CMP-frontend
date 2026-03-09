// Inspection Checklists page — Pre-Pour, Safety, Handover, Custom
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import { checklistsApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";

const TYPE_OPTIONS = [
  { value: "pre-pour", label: "🏗️ Pre-Pour Concrete", color: "text-brand-primary" },
  { value: "safety", label: "⛑️ Safety Walk", color: "text-status-warning" },
  { value: "handover", label: "🏠 Project Handover", color: "text-status-success" },
  { value: "custom", label: "📋 Custom", color: "text-text-secondary" },
];

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-surface-elevated text-text-secondary",
  "In Progress": "bg-status-warning/10 text-status-warning",
  Completed: "bg-status-success/10 text-status-success",
};

export function ChecklistsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const canEdit = ["Admin", "Project Manager", "Site Engineer"].includes(user?.role ?? "");

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("pre-pour");
  const [customItems, setCustomItems] = useState("");

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["checklists", pid],
    queryFn: () => checklistsApi.list(pid).then((r) => r.data as any[]),
    enabled: Number.isFinite(pid),
  });

  const createMutation = useMutation({
    mutationFn: () => checklistsApi.create(pid, {
      title: title || TYPE_OPTIONS.find((t) => t.value === type)?.label.split(" ").slice(1).join(" ") || "Checklist",
      checklist_type: type,
      custom_items: type === "custom" ? customItems.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists", pid] });
      setCreateOpen(false);
      setTitle("");
      setType("pre-pour");
      setCustomItems("");
      toastSuccess("Checklist created");
    },
    onError: () => toastError("Failed to create checklist"),
  });

  const toggleItem = useMutation({
    mutationFn: ({ checklistId, itemId, is_checked, notes }: { checklistId: number; itemId: number; is_checked: boolean; notes?: string }) =>
      checklistsApi.updateItem(pid, checklistId, itemId, { is_checked, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists", pid] }),
    onError: () => toastError("Failed to update item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => checklistsApi.delete(pid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists", pid] });
      toastSuccess("Checklist deleted");
    },
    onError: () => toastError("Failed to delete"),
  });

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Inspection Checklists" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Inspection Checklists</h1>
          <p className="text-sm text-text-secondary">{checklists.length} checklist{checklists.length !== 1 ? "s" : ""}</p>
        </div>
        {canEdit && (
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            + New Checklist
          </Button>
        )}
      </header>

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : checklists.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">📋</span>}
          title="No checklists yet"
          description="Create a pre-pour, safety, or handover checklist"
        />
      ) : (
        <div className="space-y-3">
          {checklists.map((cl: any) => (
            <div key={cl.id} className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
              {/* Header */}
              <div
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-surface-hover"
                onClick={() => setExpandedId(expandedId === cl.id ? null : cl.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">
                    {TYPE_OPTIONS.find((t) => t.value === cl.checklist_type)?.label.split(" ")[0] ?? "📋"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-text-primary">{cl.title}</h3>
                    <p className="text-xs text-text-secondary">
                      {cl.checked_items}/{cl.total_items} items · {cl.progress_pct}% complete
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Progress bar */}
                  <div className="hidden sm:block w-24 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-primary transition-all"
                      style={{ width: `${cl.progress_pct}%` }}
                    />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[cl.status]}`}>
                    {cl.status}
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(cl.id); }}
                      className="text-xs text-status-danger hover:opacity-80"
                    >
                      Delete
                    </button>
                  )}
                  <span className="text-text-muted text-xs">{expandedId === cl.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Items */}
              {expandedId === cl.id && (
                <div className="border-t border-surface-border divide-y divide-surface-border">
                  {cl.items.map((item: any) => (
                    <div key={item.id} className={`flex items-start gap-3 px-4 py-3 ${item.is_checked ? "bg-status-success/5" : ""}`}>
                      <input
                        type="checkbox"
                        checked={item.is_checked}
                        disabled={!canEdit}
                        onChange={(e) => toggleItem.mutate({
                          checklistId: cl.id,
                          itemId: item.id,
                          is_checked: e.target.checked,
                        })}
                        className="mt-0.5 h-4 w-4 rounded border-border-default accent-brand-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.is_checked ? "line-through text-text-muted" : "text-text-primary"}`}>
                          {item.item_text}
                        </p>
                        {item.checked_at && (
                          <p className="text-xs text-text-muted mt-0.5">
                            ✓ Checked {new Date(item.checked_at).toLocaleDateString()}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-text-secondary mt-0.5 italic">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Checklist" size="md">
          <div className="space-y-4">
            <FormField label="Checklist Type">
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`rounded-lg border px-3 py-2 text-sm text-left transition-all ${
                      type === t.value
                        ? "border-brand-primary bg-brand-primary/10 font-medium text-brand-primary"
                        : "border-surface-border text-text-secondary hover:border-brand-primary/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Title (optional)">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. Column C4 Pre-Pour Check`}
              />
            </FormField>

            {type === "custom" && (
              <FormField label="Items (one per line)" >
                <textarea
                  rows={6}
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  placeholder={"Check item 1\nCheck item 2\nCheck item 3"}
                  className="w-full rounded-md border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                />
              </FormField>
            )}

            {type !== "custom" && (
              <div className="rounded-lg bg-surface-elevated p-3">
                <p className="text-xs font-medium text-text-secondary mb-2">Template includes:</p>
                <ul className="space-y-1">
                  {(type === "pre-pour"
                    ? ["Reinforcement bars correctly placed", "Formwork aligned", "Cover blocks in position", "+ 6 more items"]
                    : type === "safety"
                    ? ["PPE check", "Safety signage", "First aid kit", "+ 6 more items"]
                    : ["Snag items resolved", "Electrical tested", "Plumbing tested", "+ 7 more items"]
                  ).map((item, i) => (
                    <li key={i} className="text-xs text-text-muted">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
                disabled={type === "custom" && !customItems.trim()}
              >
                Create Checklist
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
