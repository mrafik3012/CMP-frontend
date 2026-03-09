// MODIFIED: 2026-03-07 - Daily report form, list, PDF export per Report Templates Requirements

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonRow } from "../../components/common/Skeleton";
import { IconBarChart } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { api, budgetApi, projectsApi, reportsApi, tasksApi } from "../../api/client";
import { formatDate } from "../../utils/format";
import { useAuthStore } from "../../stores/authStore";
import { useOnline } from "../../hooks/useOnline";
import { useReportQueue } from "../../hooks/useReportQueue";

interface ProjectOption {
  id: number;
  name: string;
}

interface AuditRow {
  id: number;
  user_id: number;
  table_name: string;
  action: string;
  record_id: number | null;
  old_values?: string | null;
  new_values?: string | null;
  created_at: string;
}

export function ReportsPage() {
  const { projectId: paramProjectId } = useParams<{ projectId: string }>();
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const projectId = paramProjectId ? Number(paramProjectId) : selectedProjectId;
  const effectiveProjectId = typeof projectId === "number" && Number.isFinite(projectId) ? projectId : null;

  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "Admin";
  const online = useOnline();
  const { addToQueue } = useReportQueue();
  const [dailyReportDate, setDailyReportDate] = useState(() => new Date().toISOString().slice(0, 10));

  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useQuery<ProjectOption[]>({
    queryKey: ["projects", "for-reports"],
    queryFn: () =>
      projectsApi
        .list({ skip: 0, limit: 100 })
        .then((r) => r.data as any[])
        .then((rows) =>
          rows.map((p) => ({ id: p.id, name: p.name })) as ProjectOption[],
        ),
  });

  const {
    data: audit,
    isLoading: auditLoading,
    isError: auditError,
  } = useQuery<AuditRow[]>({
    queryKey: ["audit-log"],
    enabled: isAdmin,
    queryFn: () =>
      api.get("/audit-log").then((r) => r.data as AuditRow[]),
  });

  const handleDailyPdf = async () => {
    if (!effectiveProjectId) return;
    if (!online) {
      await addToQueue("daily_pdf", { projectId: effectiveProjectId, report_date: dailyReportDate });
      toastSuccess("Queued. Will download when back online.");
      return;
    }
    try {
      const res = await reportsApi.exportDailyPdf(effectiveProjectId, dailyReportDate);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-report-${dailyReportDate}-${effectiveProjectId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("Daily report downloaded.");
    } catch {
      toastError("Failed to download daily report");
    }
  };

  if (projectsError) {
    toastError("Failed to load projects for reports");
  }
  if (auditError) {
    toastError("Failed to load audit log");
  }

  const handleSummaryPdf = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await api.get(
        `/projects/${effectiveProjectId}/report/pdf`,
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${effectiveProjectId}-summary.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const ax = err as { response?: { status: number; data?: Blob | { detail?: string } } };
      if (ax.response?.status === 403) {
        let message = "PDF export is not available on your plan. Please upgrade.";
        if (ax.response.data instanceof Blob) {
          try {
            const text = await ax.response.data.text();
            const json = JSON.parse(text) as { detail?: string };
            if (json.detail) message = json.detail;
          } catch {
            /* use default message */
          }
        } else if (typeof ax.response.data === "object" && ax.response.data?.detail) {
          message = String(ax.response.data.detail);
        }
        toastError(message);
      } else {
        toastError("Failed to download project summary");
      }
    }
  };

  const handleBudgetCsv = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await budgetApi.exportCsv(effectiveProjectId);
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${effectiveProjectId}-budget.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toastError("Failed to export budget CSV");
    }
  };

  const handleTasksCsv = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await api.get(
        `/projects/${effectiveProjectId}/tasks/export/csv`,
        { responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${effectiveProjectId}-tasks.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toastError("Failed to export tasks CSV");
    }
  };

  const handleBudgetPdf = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await budgetApi.exportPdf(effectiveProjectId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${effectiveProjectId}-budget.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("Budget PDF downloaded.");
    } catch {
      toastError("Failed to download budget PDF");
    }
  };

  const handleTasksPdf = async () => {
    if (!effectiveProjectId) return;
    try {
      const res = await tasksApi.exportPdf(effectiveProjectId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `project-${effectiveProjectId}-tasks.pdf`;
      a.href = url;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("Tasks PDF downloaded.");
    } catch {
      toastError("Failed to download tasks PDF");
    }
  };

  const getWeekStart = (d: Date) => {
    const day = d.getDay();
    const monOffset = day === 0 ? -6 : 1 - day;
    const m = new Date(d);
    m.setDate(d.getDate() + monOffset);
    return m.toISOString().slice(0, 10);
  };
  const [weeklyDate, setWeeklyDate] = useState(() => {
    const d = new Date();
    return getWeekStart(d);
  });
  const [monthlyYear, setMonthlyYear] = useState(() => new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(() => new Date().getMonth() + 1);

  const handleWeeklyPdf = async () => {
    if (!effectiveProjectId) return;
    if (!online) {
      await addToQueue("weekly_pdf", { projectId: effectiveProjectId, week_start: weeklyDate });
      toastSuccess("Queued. Will download when back online.");
      return;
    }
    try {
      const res = await reportsApi.exportWeeklyPdf(effectiveProjectId, weeklyDate);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly-report-${weeklyDate}-${effectiveProjectId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("Weekly report downloaded.");
    } catch {
      toastError("Failed to download weekly report");
    }
  };

  const handleMonthlyPdf = async () => {
    if (!effectiveProjectId) return;
    if (!online) {
      await addToQueue("monthly_pdf", { projectId: effectiveProjectId, year: monthlyYear, month: monthlyMonth });
      toastSuccess("Queued. Will download when back online.");
      return;
    }
    try {
      const res = await reportsApi.exportMonthlyPdf(effectiveProjectId, monthlyYear, monthlyMonth);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monthly-report-${monthlyYear}-${String(monthlyMonth).padStart(2, "0")}-${effectiveProjectId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("Monthly report downloaded.");
    } catch {
      toastError("Failed to download monthly report");
    }
  };

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Reports" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBarChart className="h-5 w-5 text-status-info" />
          <h1 className="text-2xl font-bold text-text-primary">
            Reports
          </h1>
        </div>
      </header>

      {/* Select project (when not in project context) */}
      {!paramProjectId && (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-text-secondary">
            Select project:
          </span>
          {projectsLoading ? (
            <span className="text-sm text-text-secondary">
              Loading projects...
            </span>
          ) : !projects || projects.length === 0 ? (
            <span className="text-sm text-text-secondary">
              No projects available.
            </span>
          ) : (
            <select
              className="h-9 rounded-md border border-border-default bg-surface-base px-3 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/40"
              value={selectedProjectId}
              onChange={(e) =>
                setSelectedProjectId(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>
      )}

      {/* Daily report: select date, download PDF from existing data (no form) */}
      {effectiveProjectId != null && (
        <section className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <h2 className="text-sm font-semibold text-text-primary">
            Daily report
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Generated from current project data (tasks, workers). Select date and download — no manual entry.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-text-secondary">
              Report date:
            </label>
            <input
              type="date"
              className="input-base w-40"
              value={dailyReportDate}
              onChange={(e) => setDailyReportDate(e.target.value)}
            />
            <Button variant="primary" size="sm" onClick={handleDailyPdf} className="min-h-[48px] min-w-[48px]">
              Download Daily PDF
            </Button>
          </div>
        </section>
      )}

      {/* Project exports (summary, budget, tasks) */}
      {effectiveProjectId != null && (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-background-primary/80 p-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Project Summary PDF
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Download a high-level summary of the selected project.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={handleSummaryPdf}
              >
                Download Project Summary
              </Button>
            </div>
            <div className="rounded-lg border border-border-subtle bg-background-primary/80 p-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Budget export
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                CSV for Excel/data; PDF for formatted viewing and printing.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleBudgetCsv}>
                  Budget CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={handleBudgetPdf}>
                  Budget PDF
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-background-primary/80 p-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Tasks export
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                CSV for Excel/data; PDF for formatted viewing and printing.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handleTasksCsv}>
                  Tasks CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={handleTasksPdf}>
                  Tasks PDF
                </Button>
              </div>
            </div>
        </div>

        <h2 className="mt-6 mb-2 text-sm font-semibold text-text-primary">
          Period reports (no form)
        </h2>
        <p className="mb-3 text-xs text-text-secondary">
          Download weekly or monthly reports from existing daily reports. No data entry required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-background-primary/80 p-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Weekly Report PDF
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Week starting (Monday):
              </p>
              <input
                type="date"
                className="input-base mt-1 w-full max-w-[180px]"
                value={weeklyDate}
                onChange={(e) => setWeeklyDate(e.target.value)}
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 min-h-[48px] min-w-[48px]"
                onClick={handleWeeklyPdf}
              >
                Download Weekly PDF
              </Button>
            </div>
            <div className="rounded-lg border border-border-subtle bg-background-primary/80 p-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Monthly Report PDF
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Year and month:
              </p>
              <div className="mt-1 flex gap-2">
                <select
                  className="input-base w-24"
                  value={monthlyYear}
                  onChange={(e) => setMonthlyYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  className="input-base w-32"
                  value={monthlyMonth}
                  onChange={(e) => setMonthlyMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 min-h-[48px] min-w-[48px]"
                onClick={handleMonthlyPdf}
              >
                Download Monthly PDF
              </Button>
            </div>
        </div>
        </section>
      )}

      {/* Audit log */}
      {isAdmin && (
        <section className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">
            Audit Log
          </h2>
          {auditLoading ? (
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-surface-border bg-surface-elevated">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Table</th>
                  <th className="px-4 py-2">Record</th>
                  <th className="px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRow cols={5} />
                <SkeletonRow cols={5} />
              </tbody>
            </table>
          ) : !audit || audit.length === 0 ? (
            <EmptyState
              icon={<IconBarChart />}
              title="No audit entries"
              description="System changes will appear here for admins."
            />
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-surface-border bg-surface-elevated">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Table</th>
                  <th className="px-4 py-2">Record</th>
                  <th className="px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {audit.slice(0, 50).map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-surface-border"
                  >
                    <td className="px-4 py-2 text-text-secondary">
                      User #{row.user_id}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {row.action}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {row.table_name}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {row.record_id ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-text-secondary">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

