/**
 * Project tasks list with Add/Edit/Delete, filters, overdue highlight, Gantt view.
 */
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { tasksApi, usersApi } from "../../api/client";
import { useToast } from "../../components/common/Toast";
import { useAuthStore } from "../../stores/authStore";
import { Modal } from "../../components/common/Modal";
import { GanttChart } from "./GanttChart";
import { format, isPast, parseISO } from "date-fns";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Not Started", "In Progress", "On Hold", "Completed"];

interface TaskForm {
  title: string;
  description: string;
  priority: string;
  status: string;
  start_date: string;
  due_date: string;
  assignee_id: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  Low: "bg-background-primary/80 text-text-muted",
  Medium: "bg-accent-secondary/15 text-accent-secondary",
  High: "bg-status-warning/15 text-status-warning",
  Critical: "bg-status-error/15 text-status-error",
};
const STATUS_BADGE: Record<string, string> = {
  // Task state colors: blue = pending, amber = in progress, green = completed, red = delayed (handled separately)
  "Not Started": "bg-accent-secondary/15 text-accent-secondary",
  "In Progress": "bg-status-warning/15 text-status-warning",
  "On Hold": "bg-status-error/15 text-status-error",
  Completed: "bg-status-success/15 text-status-success",
};

const INPUT =
  "w-full rounded-md border border-border-default bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/40";
const LABEL =
  "mb-1 block text-sm font-medium text-text-secondary";

export function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === "Admin" || user?.role === "Project Manager" || user?.role === "Site Engineer";

  const [view, setView] = useState<"list" | "gantt">("list");
  const [ganttMode, setGanttMode] = useState<"Day" | "Week" | "Month">("Week");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", pid],
    enabled: Number.isFinite(pid),
    queryFn: () => tasksApi.list(pid).then((r) => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TaskForm>();
  const startDate = watch("start_date");

  const openAdd = () => {
    setEditingTask(null);
    reset({ title: "", description: "", priority: "Medium", status: "Not Started", start_date: "", due_date: "", assignee_id: "" });
    setShowModal(true);
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      start_date: task.start_date?.slice(0, 10) ?? "",
      due_date: task.due_date?.slice(0, 10) ?? "",
      assignee_id: task.assignee_id ?? "",
    });
    setShowModal(true);
  };

  type SaveTaskPayload = TaskForm & { editingTaskId?: number | null };
  const saveMutation = useMutation({
    mutationFn: (payload: SaveTaskPayload) => {
      const { editingTaskId, ...formData } = payload;
      const data = {
        ...formData,
        assignee_id: formData.assignee_id ? Number(formData.assignee_id) : null,
        priority: formData.priority as any,
        status: formData.status as any,
      };
      return editingTaskId != null
        ? tasksApi.update(editingTaskId, data as any).then((r) => r.data)
        : tasksApi.create(pid, data as any).then((r) => r.data);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks", pid] });
      toastSuccess(variables.editingTaskId != null ? "Task updated" : "Task created");
    },
    onError: () => toastError("Failed to save task"),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", pid] });
      toastSuccess("Task deleted");
    },
    onError: () => toastError("Failed to delete task"),
  });

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t: any) => {
      if (filterStatus !== "All" && t.status !== filterStatus) return false;
      if (filterPriority !== "All" && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority]);

  const isOverdue = (t: any) =>
    t.due_date && t.status !== "Completed" && isPast(parseISO(t.due_date));

  const getUserName = (id: number) => {
    const u = users?.find((u: any) => u.id === id);
    return u ? (u.full_name ?? u.email) : `#${id}`;
  };

  const ganttTasks = (filteredTasks ?? [])
    .filter((t: any) => t.start_date && t.due_date)
    .map((t: any) => ({
      id: String(t.id),
      name: t.title,
      start: t.start_date.slice(0, 10),
      end: t.due_date.slice(0, 10),
      progress: t.status === "Completed" ? 100
        : t.status === "In Progress" ? 50
          : t.status === "On Hold" ? 25 : 0,
      dependencies: "",
    }));

  if (!Number.isFinite(pid))
    return (
      <p className="p-6 text-status-error">
        Invalid project ID.
      </p>
    );
  if (isLoading)
    return (
      <p className="p-6 text-text-secondary">
        Loading tasks...
      </p>
    );
  if (error)
    return (
      <p className="p-6 text-status-error">
        Error loading tasks.
      </p>
    );

  const overdueCount = tasks?.filter((t: any) => isOverdue(t)).length ?? 0;

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Tasks
          </h2>
          {overdueCount > 0 && (
            <span className="rounded-full bg-status-error/15 px-2 py-0.5 text-xs font-medium text-status-error">
              {overdueCount} overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded border border-border-default text-sm">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 ${view === "list"
                  ? "bg-accent-primary text-text-inverse"
                  : "text-text-secondary hover:bg-surface-hover"
                }`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setView("gantt")}
              className={`px-3 py-1.5 ${view === "gantt"
                  ? "bg-accent-primary text-text-inverse"
                  : "text-text-secondary hover:bg-surface-hover"
                }`}
            >
              📊 Gantt
            </button>
          </div>
          {canEdit && (
            <button onClick={openAdd}
              className="rounded bg-accent-primary px-4 py-2 text-sm text-text-inverse hover:bg-accent-primaryHover">
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-2 flex gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded border border-border-default bg-surface-card px-3 py-1.5 text-sm text-text-primary">
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="rounded border border-border-default bg-surface-card px-3 py-1.5 text-sm text-text-primary">
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        {(filterStatus !== "All" || filterPriority !== "All") && (
          <button onClick={() => { setFilterStatus("All"); setFilterPriority("All"); }}
            className="text-sm text-accent-secondary hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Gantt View */}
      {view === "gantt" && (
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <div className="mb-4 flex gap-2">
            {(["Day", "Week", "Month"] as const).map(m => (
              <button key={m} onClick={() => setGanttMode(m)}
                className={`rounded px-3 py-1 text-xs font-medium border ${ganttMode === m
                    ? "border-accent-primary bg-accent-primary text-text-inverse"
                    : "border-border-default text-text-secondary hover:bg-surface-hover"
                  }`}>
                {m}
              </button>
            ))}
          </div>
          <GanttChart viewMode={ganttMode} tasks={ganttTasks} />
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <>
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-text-muted">
              <p className="mb-2 text-4xl">📋</p>
              <p className="font-medium">
                {tasks?.length === 0 ? "No tasks yet" : "No tasks match filters"}
              </p>
              {canEdit && tasks?.length === 0 && (
                <p className="mt-1 text-sm">
                  Click <strong>+ Add Task</strong> to create one
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-background-primary/80">
                  <tr>
                    {["Title", "Priority", "Status", "Start", "Due", "Assignee", ""].map(h => (
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
                  {filteredTasks.map((t: any) => (
                    <tr key={t.id}
                      className={`border-t border-border-subtle hover:bg-surface-hover ${isOverdue(t) ? "bg-status-error/5" : ""
                        }`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{t.title}</div>
                        {t.description && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-text-secondary">
                            {t.description}
                          </div>
                        )}
                        {isOverdue(t) && (
                          <span className="text-xs font-medium text-status-error">
                            ⚠ Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[t.priority] ?? ""}`}>{t.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[t.status] ?? ""}`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{t.start_date ? format(parseISO(t.start_date), "dd MMM yyyy") : "-"}</td>
                      <td className={`px-4 py-3 font-medium ${isOverdue(t) ? "text-status-error" : "text-text-secondary"}`}>
                        {t.due_date ? format(parseISO(t.due_date), "dd MMM yyyy") : "-"}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {t.assignee_id ? getUserName(t.assignee_id) : <span className="text-text-muted">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(t)}
                              className="text-xs text-accent-secondary hover:underline"
                            >
                              Edit
                            </button>
                            <button onClick={() => { if (confirm("Delete this task?")) deleteMutation.mutate(t.id); }}
                              className="text-xs text-status-error hover:underline">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal - same pattern as New Site Log: Modal component + close in mutation onSuccess */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
          reset();
        }}
        title={editingTask ? "Edit Task" : "Add Task"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit((d) => {
            const payload: SaveTaskPayload = { ...d, editingTaskId: editingTask?.id ?? null };
            saveMutation.mutateAsync(payload).then(
              () => {
                setShowModal(false);
                setEditingTask(null);
                reset();
              },
              () => { }
            );
          })}
          className="space-y-4"
        >
          <div>
            <label className={LABEL}>Title *</label>
            <input {...register("title", { required: "Title is required" })}
              className={INPUT} placeholder="Task title" />
            {errors.title && (
              <p className="mt-1 text-xs text-status-error">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>Description</label>
            <textarea {...register("description")} rows={2} className={INPUT} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Priority</label>
              <select {...register("priority")} className={INPUT}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select {...register("status")} className={INPUT}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Start Date *</label>
              <input
                type="date"
                {...register("start_date", { required: "Start date is required" })}
                className={INPUT}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-status-error">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL}>Due Date *</label>
              <input
                type="date"
                {...register("due_date", {
                  required: "Due date is required",
                  validate: (v) =>
                    !startDate || !v || v >= startDate || "Due date must be on or after start date",
                })}
                className={INPUT}
                min={startDate}
              />
              {errors.due_date && (
                <p className="mt-1 text-xs text-status-error">
                  {errors.due_date.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className={LABEL}>Assignee</label>
            <select {...register("assignee_id")} className={INPUT}>
              <option value="">— Unassigned —</option>
              {users?.map((u: any) => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded bg-accent-primary px-5 py-2 text-sm text-text-inverse hover:bg-accent-primaryHover disabled:opacity-60"
            >
              {saveMutation.isPending
                ? "Saving..."
                : editingTask
                  ? "Save Changes"
                  : "Create Task"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingTask(null);
                reset();
              }}
              className="rounded border border-border-default bg-background-primary px-5 py-2 text-sm text-text-secondary hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
