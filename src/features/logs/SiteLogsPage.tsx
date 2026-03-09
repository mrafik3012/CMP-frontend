// MODIFIED: 2026-03-04 - Added progress photo panel per log entry

import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonRow } from "../../components/common/Skeleton";
import { Modal } from "../../components/common/Modal";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { IconCalendar } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { LogPhotoPanel } from "../../components/common/LogPhotoPanel";
import { logsApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import { formatDate } from "../../utils/format";

interface DailyLogRow {
  id: number;
  project_id: number;
  date: string;
  weather: string;
  workers_present?: number[] | null;
  work_completed: string;
  issues?: string | null;
}

const logSchema = z.object({
  date: z.string().min(1, "Date is required"),
  weather: z.enum(
    ["Clear", "Cloudy", "Rain", "Extreme Heat"] as const,
    { required_error: "Weather is required" },
  ),
  work_completed: z.string().min(1, "Work completed is required"),
  issues: z.string().optional(),
});

type LogFormData = z.infer<typeof logSchema>;

const WEATHER_ICON: Record<string, string> = {
  Clear: "☀️",
  Cloudy: "☁️",
  Rain: "🌧️",
  "Extreme Heat": "🌡️",
};

export function SiteLogsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const canCreate =
    role === "Admin" ||
    role === "Project Manager" ||
    role === "Site Engineer";

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [logPhotoFiles, setLogPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const logPhotoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery<DailyLogRow[]>({
    queryKey: ["logs", pid],
    enabled: Number.isFinite(pid),
    queryFn: () => logsApi.listByProject(pid).then((r) => r.data as DailyLogRow[]),
  });

  if (isError) toastError("Failed to load logs");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: { weather: "Clear" },
  });

  type CreateLogPayload = { formData: LogFormData; photoFiles: File[] };
  const createMutation = useMutation({
    mutationFn: async ({ formData }: CreateLogPayload) => {
      const res = await logsApi.create(pid, {
        date: formData.date,
        weather: formData.weather,
        work_completed: formData.work_completed,
        issues: formData.issues,
        workers_present: [],
      } as any);
      return res.data as { id: number; date: string };
    },
    onSuccess: async (createdLog, variables) => {
      const logDate = variables.formData.date.slice(0, 10);
      const files = variables.photoFiles ?? [];
      let uploadFailed = false;
      for (const file of files) {
        try {
          await logsApi.uploadPhoto(pid, logDate, file, "");
        } catch {
          uploadFailed = true;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["logs", pid] });
      queryClient.invalidateQueries({ queryKey: ["log-photos", pid, logDate] });
      setLogModalOpen(false);
      reset();
      setLogPhotoFiles([]);
      setPhotoError(null);
      if (uploadFailed) {
        toastError("Log saved but one or more photos failed to upload. You can add them from the log row.");
      } else {
        toastSuccess("Log saved successfully");
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to create log";
      const message = typeof msg === "string" ? msg : Array.isArray(msg) ? msg.map((m: any) => m?.msg ?? m).join(", ") : "Failed to create log";
      toastError(message);
    },
  });

  const handleExport = async (logId: number) => {
    try {
      const res = await logsApi.exportPdf(logId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log-${logId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toastError("Failed to export log PDF");
    }
  };

  if (!Number.isFinite(pid)) {
    return <div className="p-6 text-status-danger">Invalid project ID for logs.</div>;
  }

  const logs = data ?? [];

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Site Logs" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Site Logs</h1>
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              reset();
              setLogPhotoFiles([]);
              setPhotoError(null);
              setLogModalOpen(true);
            }}
          >
            + New Log
          </Button>
        )}
      </header>

      <div className="rounded-xl border border-border-subtle bg-surface-card shadow-card">
        {isLoading ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-background-primary/80">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Weather</th>
                <th className="px-4 py-2">Work Completed</th>
                <th className="px-4 py-2">Issues</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow cols={5} />
              <SkeletonRow cols={5} />
            </tbody>
          </table>
        ) : logs.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<IconCalendar />}
              title="No site logs"
              description="Create your first daily site log for this project"
            />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-background-primary/80">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Weather</th>
                <th className="px-4 py-2">Work Completed</th>
                <th className="px-4 py-2">Issues</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className="cursor-pointer border-t border-surface-border hover:bg-surface-hover"
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-2 font-medium text-text-primary">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      {WEATHER_ICON[log.weather] ?? ""} {log.weather}
                    </td>
                    <td className="max-w-xs px-4 py-2 text-xs text-text-secondary">
                      <p className="line-clamp-2">{log.work_completed}</p>
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      {log.issues ? (
                        <span className="text-status-warning">{log.issues}</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-text-secondary hover:text-text-primary"
                          onClick={(e) => { e.stopPropagation(); handleExport(log.id); }}
                        >
                          📄 PDF
                        </button>
                        <button
                          type="button"
                          className="text-text-secondary hover:text-brand-primary"
                          onClick={(e) => { e.stopPropagation(); setExpandedLogId(expandedLogId === log.id ? null : log.id); }}
                        >
                          📷 Photos {expandedLogId === log.id ? "▲" : "▼"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedLogId === log.id && (
                    <tr key={`photos-${log.id}`} className="bg-surface-elevated">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="max-w-2xl">
                          <p className="mb-2 text-sm text-text-secondary">{log.work_completed}</p>
                          {log.issues && (
                            <p className="mb-3 text-xs text-status-warning">⚠️ {log.issues}</p>
                          )}
                          {canCreate && (
                            <LogPhotoPanel projectId={pid} date={log.date} />
                          )}
                          {!canCreate && (
                            <LogPhotoPanel projectId={pid} date={log.date} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {logModalOpen && (
        <Modal
          isOpen={logModalOpen}
          onClose={() => {
            setLogModalOpen(false);
            setLogPhotoFiles([]);
            setPhotoError(null);
          }}
          title="New Site Log"
          size="md"
        >
          <form
            onSubmit={handleSubmit((d) => {
              if (logPhotoFiles.length < 1) {
                setPhotoError("At least 1 photo is required");
                return;
              }
              setPhotoError(null);
              createMutation.mutate({ formData: d, photoFiles: [...logPhotoFiles] });
            })}
            className="space-y-3"
          >
            <FormField label="Date" required error={errors.date?.message}>
              <Input type="date" {...register("date")} />
            </FormField>
            <FormField label="Weather" required error={errors.weather?.message}>
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("weather")}
              >
                <option value="Clear">☀️ Clear</option>
                <option value="Cloudy">☁️ Cloudy</option>
                <option value="Rain">🌧️ Rain</option>
                <option value="Extreme Heat">🌡️ Extreme Heat</option>
              </select>
            </FormField>
            <FormField label="Work Completed" required error={errors.work_completed?.message}>
              <textarea
                rows={3}
                className="w-full rounded-md border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("work_completed")}
              />
            </FormField>
            <FormField label="Issues / Delays" error={errors.issues?.message}>
              <textarea
                rows={2}
                className="w-full rounded-md border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("issues")}
              />
            </FormField>

            <FormField
              label="Photos"
              required
              error={photoError ?? undefined}
            >
              <div className="space-y-2">
                <input
                  ref={logPhotoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    const valid = files.filter((f) => {
                      const ext = f.name.split(".").pop()?.toLowerCase();
                      return [".jpg", ".jpeg", ".png", ".webp"].some((x) => x.slice(1) === ext);
                    });
                    if (valid.some((f) => f.size > 10 * 1024 * 1024)) {
                      toastError("Each file must be under 10MB");
                      return;
                    }
                    setLogPhotoFiles((prev) => [...prev, ...valid].slice(0, 20));
                    setPhotoError(null);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => logPhotoInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-default bg-surface-base py-3 text-sm text-text-secondary hover:border-brand-primary hover:text-text-primary"
                >
                  <span className="text-lg">📷</span>
                  Add photos (at least 1 required, max 20)
                </button>
                <p className="text-xs text-text-muted">JPG, PNG, WEBP · Max 10MB each</p>
                {logPhotoFiles.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded border border-border-default bg-background-primary/50 p-2 text-sm">
                    {logPhotoFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                        <span className="truncate text-text-secondary">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setLogPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="shrink-0 text-status-error hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setLogModalOpen(false);
                  setLogPhotoFiles([]);
                  setPhotoError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting || createMutation.isPending}
                disabled={isSubmitting || createMutation.isPending}
              >
                Save Log
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
