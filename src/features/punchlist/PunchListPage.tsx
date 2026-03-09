// Punch List / Snag List page
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { EmptyState } from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import { punchListApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";

const PRIORITY_COLOR: Record<string, string> = {
  Low: "text-text-secondary",
  Medium: "text-status-warning",
  High: "text-status-danger",
  Critical: "text-status-danger font-bold",
};

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const schema = z.object({
  title: z.string().min(2, "Title required"),
  location: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PunchListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const canEdit = ["Admin", "Project Manager", "Site Engineer"].includes(user?.role ?? "");

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["punch-list", pid, statusFilter, priorityFilter],
    queryFn: () => punchListApi.list(pid, {
      status: statusFilter !== "All" ? statusFilter : undefined,
      priority: priorityFilter !== "All" ? priorityFilter : undefined,
    }).then((r) => r.data as any[]),
    enabled: Number.isFinite(pid),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "Medium" },
  });

  const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit, formState: { errors: editErrors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "Medium" },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => punchListApi.create(pid, {
      ...data,
      assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["punch-list", pid] });
      setCreateOpen(false);
      reset();
      toastSuccess("Punch item created");
    },
    onError: () => toastError("Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => punchListApi.update(pid, editItem.id, {
      ...data,
      assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["punch-list", pid] });
      setEditItem(null);
      toastSuccess("Updated");
    },
    onError: () => toastError("Failed to update"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      punchListApi.update(pid, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["punch-list", pid] }),
    onError: () => toastError("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => punchListApi.delete(pid, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["punch-list", pid] });
      toastSuccess("Deleted");
    },
    onError: () => toastError("Failed to delete"),
  });

  const openCount = items.filter((i) => i.status === "Open").length;
  const resolvedCount = items.filter((i) => i.status === "Resolved" || i.status === "Closed").length;

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Punch List" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Punch List</h1>
          <p className="text-sm text-text-secondary">
            {openCount} open · {resolvedCount} resolved · {items.length} total
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            + Add Item
          </Button>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:outline-none"
        >
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:outline-none"
        >
          <option value="All">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : items.length === 0 ? (
          <EmptyState icon={<span className="text-2xl">✅</span>} title="No punch items" description="All clear — or add a new snag item" />
        ) : (
          items.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-surface-border bg-surface-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${PRIORITY_COLOR[item.priority]}`}>
                      [{item.priority}]
                    </span>
                    <h3 className="text-sm font-medium text-text-primary truncate">{item.title}</h3>
                    <Badge status={item.status} />
                  </div>
                  {item.location && (
                    <p className="mt-1 text-xs text-text-secondary">📍 {item.location}</p>
                  )}
                  {item.description && (
                    <p className="mt-1 text-xs text-text-muted">{item.description}</p>
                  )}
                  {item.due_date && (
                    <p className="mt-1 text-xs text-text-muted">Due: {item.due_date}</p>
                  )}
                  {item.photo_path && (
                    <img
                      src={`http://localhost:8000${item.photo_path}`}
                      alt="punch photo"
                      className="mt-2 h-24 w-40 rounded-lg object-cover border border-border-default"
                    />
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => statusMutation.mutate({ id: item.id, status: e.target.value })}
                      className="h-8 rounded-md border border-surface-border bg-surface-base px-2 text-xs text-text-primary focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        setEditItem(item);
                        resetEdit({
                          title: item.title,
                          location: item.location ?? "",
                          description: item.description ?? "",
                          priority: item.priority,
                          due_date: item.due_date ?? "",
                          assigned_to: item.assigned_to ? String(item.assigned_to) : "",
                        });
                      }}
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-xs text-status-danger hover:opacity-80"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {createOpen && (
        <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Punch Item" size="md">
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
            <FormField label="Title" required error={errors.title?.message}>
              <Input {...register("title")} placeholder="e.g. Crack in column C4" />
            </FormField>
            <FormField label="Location" error={errors.location?.message}>
              <Input {...register("location")} placeholder="e.g. Floor 2, Grid C4" />
            </FormField>
            <FormField label="Description" error={errors.description?.message}>
              <textarea rows={2} className="w-full rounded-md border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30" {...register("description")} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Priority" error={errors.priority?.message}>
                <select className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:outline-none" {...register("priority")}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="Due Date" error={errors.due_date?.message}>
                <Input type="date" {...register("due_date")} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={createMutation.isPending}>Create</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Punch Item" size="md">
          <form onSubmit={handleEdit((d) => updateMutation.mutate(d))} className="space-y-3">
            <FormField label="Title" required error={editErrors.title?.message}>
              <Input {...regEdit("title")} />
            </FormField>
            <FormField label="Location" error={editErrors.location?.message}>
              <Input {...regEdit("location")} />
            </FormField>
            <FormField label="Description" error={editErrors.description?.message}>
              <textarea rows={2} className="w-full rounded-md border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30" {...regEdit("description")} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Priority" error={editErrors.priority?.message}>
                <select className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:outline-none" {...regEdit("priority")}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="Due Date" error={editErrors.due_date?.message}>
                <Input type="date" {...regEdit("due_date")} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={updateMutation.isPending}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
