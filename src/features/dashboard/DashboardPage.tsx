/**
 * Dashboard overview for construction portfolio.
 * Premium dark industrial layout optimized for quick scanning.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";
import { dashboardApi, projectsApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import { formatCurrency, formatDate } from "../../utils/format";
import { Button } from "../../components/common/Button";

const STAT_CARDS = [
  {
    key: "active_projects_count",
    label: "Active Projects",
    icon: "🏗️",
    tone: "accent",
  },
  {
    key: "overdue_tasks_count",
    label: "Overdue Tasks",
    icon: "⏱️",
    tone: "error",
  },
  {
    key: "total_budget_committed",
    label: "Budget Committed",
    icon: "💰",
    tone: "warning",
    currency: true,
  },
  {
    key: "total_actual_spent",
    label: "Actual Spent",
    icon: "📊",
    tone: "success",
    currency: true,
  },
] as const;

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.overview().then((r) => r.data),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list({ limit: 6 }).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-text-secondary animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-status-error">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const upcoming = data?.upcoming_deadlines ?? [];
  const overdueDeadlines = upcoming.filter((d: any) =>
    isPast(parseISO(d.due_date))
  );
  const normalDeadlines = upcoming.filter(
    (d: any) => !isPast(parseISO(d.due_date))
  );

  const recentActivity = data?.recent_activity ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Top bar: greeting + quick actions */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {format(new Date(), "EEEE, d MMMM yyyy")} · Site overview
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/reports">
            <Button
              variant="secondary"
              size="sm"
              className="border-border-default bg-surface-card/70"
            >
              Portfolio report
            </Button>
          </Link>
          <Link to="/projects/new">
            <Button variant="primary" size="sm">
              + New project
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const raw = (data as any)?.[card.key] ?? 0;
          const valueToneClass =
            card.tone === "success"
              ? "text-status-success"
              : card.tone === "error"
              ? "text-status-error"
              : card.tone === "warning"
              ? "text-status-warning"
              : "text-accent-secondary";
          const iconBgClass =
            card.tone === "success"
              ? "bg-status-success/10 text-status-success"
              : card.tone === "error"
              ? "bg-status-error/10 text-status-error"
              : card.tone === "warning"
              ? "bg-status-warning/10 text-status-warning"
              : "bg-accent-secondary/10 text-accent-secondary";

          return (
            <article
              key={card.key}
              className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-card/80 p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    {card.label}
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${valueToneClass}`}>
                    {card.currency ? formatCurrency(raw) : raw}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgClass}`}
                >
                  <span className="text-base">{card.icon}</span>
                </div>
              </div>
              {card.key === "overdue_tasks_count" && raw > 0 && (
                <p className="mt-3 text-xs text-status-error">
                  {raw} tasks need attention today.
                </p>
              )}
              {card.key === "active_projects_count" && raw === 0 && (
                <p className="mt-3 text-xs text-text-muted">
                  No active projects yet. Create one to get started.
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* Main grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left column: project & task progress */}
        <div className="space-y-6 lg:col-span-2">
          {/* Portfolio health & milestones */}
          <article className="rounded-xl border border-border-subtle bg-surface-card/90 p-4 shadow-card">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Project portfolio
                </h2>
                <p className="text-xs text-text-muted">
                  Track schedule health, milestones, and risk across jobs.
                </p>
              </div>
              <Link
                to="/projects"
                className="text-xs font-medium text-accent-secondary hover:underline"
              >
                View all projects →
              </Link>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Schedule health */}
              <div className="space-y-3 rounded-lg border border-border-subtle bg-background-primary/70 p-3">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Overall schedule health
                  </span>
                  <span>
                    {data?.on_track_projects_count ?? 0} on track ·{" "}
                    {data?.at_risk_projects_count ?? 0} at risk
                  </span>
                </div>
                <div className="h-2 rounded-full bg-divider">
                  <div
                    className="h-full rounded-full bg-status-success"
                    style={{
                      width: `${
                        Math.min(
                          100,
                          Number(data?.on_track_percentage ?? 0)
                        ) || 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>0%</span>
                  <span>
                    {Math.round(Number(data?.on_track_percentage ?? 0))}% of
                    projects on schedule
                  </span>
                  <span>100%</span>
                </div>
              </div>

              {/* Milestone completion */}
              <div className="space-y-3 rounded-lg border border-border-subtle bg-background-primary/70 p-3">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Milestone completion
                  </span>
                  <span>
                    {data?.completed_milestones_count ?? 0}/
                    {data?.total_milestones_count ?? 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(data?.key_milestones ?? []).slice(0, 3).map((m: any) => {
                    const overdue = isPast(parseISO(m.target_date));
                    const color = overdue
                      ? "bg-status-error"
                      : m.completed
                      ? "bg-status-success"
                      : "bg-status-warning";
                    return (
                      <div key={m.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="truncate text-text-secondary">
                            {m.name}
                          </span>
                          <span className="text-text-muted">
                            {formatDate(m.target_date)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-divider">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{
                              width: `${Math.min(100, m.progress ?? 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          {/* Timeline view: upcoming & delayed tasks */}
          <article className="rounded-xl border border-border-subtle bg-surface-card/90 p-4 shadow-card">
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Timeline & deadlines
              </h2>
              {overdueDeadlines.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-status-error/15 px-2 py-0.5 text-[11px] font-medium text-status-error">
                  {overdueDeadlines.length} delayed
                </span>
              )}
            </header>

            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                No upcoming deadlines.
              </p>
            ) : (
              <ul className="space-y-2">
                {[...overdueDeadlines, ...normalDeadlines].map((d: any) => {
                  const overdue = isPast(parseISO(d.due_date));
                  const stateClass = overdue
                    ? "bg-status-error/10 text-status-error"
                    : "bg-status-warning/10 text-status-warning";
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border border-border-subtle bg-background-primary/80 px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${stateClass}`}
                        >
                          {overdue ? "Delayed" : "Upcoming"}
                        </span>
                        <Link
                          to={`/projects/${d.project_id}/tasks`}
                          className="truncate font-medium text-text-primary hover:underline"
                        >
                          {d.title}
                        </Link>
                      </div>
                      <span
                        className={`ml-3 whitespace-nowrap text-[11px] ${
                          overdue ? "text-status-error" : "text-text-secondary"
                        }`}
                      >
                        {format(parseISO(d.due_date), "dd MMM")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </div>

        {/* Right column: photos, approvals, activity */}
        <div className="space-y-6">
          {/* Photo-based progress cards */}
          <article className="rounded-xl border border-border-subtle bg-surface-card/90 p-4 shadow-card">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Site progress
              </h2>
              <span className="text-[11px] text-text-muted">
                Latest photos & milestones
              </span>
            </header>
            {!projects || projects.length === 0 ? (
              <p className="py-4 text-center text-xs text-text-muted">
                Progress photos will appear here once site logs include images.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.slice(0, 4).map((p: any) => {
                  const status = String(p.status ?? "").toLowerCase();
                  const stateClass =
                    status === "completed"
                      ? "bg-status-success/15 text-status-success"
                      : status === "active"
                      ? "bg-status-warning/15 text-status-warning"
                      : status === "on hold"
                      ? "bg-status-error/15 text-status-error"
                      : "bg-accent-secondary/15 text-accent-secondary";

                  return (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}/logs`}
                      className="group rounded-lg border border-border-subtle bg-background-primary/80 p-3 transition-colors hover:border-accent-primary"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-text-primary">
                          {p.name}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${stateClass}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="h-20 rounded-md bg-[radial-gradient(circle_at_top,_#3a7dff33,_transparent_55%),_linear-gradient(135deg,_#1b1f27,_#101319)] opacity-80 transition-opacity group-hover:opacity-100" />
                      <p className="mt-2 text-[11px] text-text-muted">
                        Started {formatDate(p.start_date)} ·{" "}
                        {p.location ?? "Site location TBD"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>

          {/* Approvals + delays summary */}
          <article className="space-y-3 rounded-xl border border-border-subtle bg-surface-card/90 p-4 shadow-card">
            <header className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Approvals & delays
              </h2>
            </header>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-background-primary/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent-secondary" />
                  <span className="text-text-secondary">
                    Pending approvals
                  </span>
                </div>
                <span className="font-medium text-accent-secondary">
                  {data?.pending_approvals_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background-primary/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-warning" />
                  <span className="text-text-secondary">In progress</span>
                </div>
                <span className="font-medium text-status-warning">
                  {data?.in_progress_tasks_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background-primary/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-error" />
                  <span className="text-text-secondary">Delayed</span>
                </div>
                <span className="font-medium text-status-error">
                  {data?.delayed_tasks_count ?? data?.overdue_tasks_count ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background-primary/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-status-success" />
                  <span className="text-text-secondary">Completed</span>
                </div>
                <span className="font-medium text-status-success">
                  {data?.completed_tasks_count ?? 0}
                </span>
              </div>
            </div>
            <Link to="/notifications">
              <Button
                variant="secondary"
                size="sm"
                className="mt-1 w-full justify-center border-border-default bg-background-primary/90 text-xs"
              >
                Go to approval queue
              </Button>
            </Link>
          </article>

          {/* Recent site updates */}
          <article className="rounded-xl border border-border-subtle bg-surface-card/90 p-4 shadow-card">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Recent site updates
              </h2>
            </header>
            {recentActivity.length === 0 ? (
              <p className="py-4 text-center text-xs text-text-muted">
                Daily logs, RFIs, and approvals will appear here as teams
                update the site.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {recentActivity.slice(0, 6).map((item: any) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg bg-background-primary/80 px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="text-text-primary">{item.message}</p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {item.project_name
                          ? `${item.project_name} · ${formatDate(
                              item.created_at
                            )}`
                          : formatDate(item.created_at)}
                      </p>
                    </div>
                    <span className="mt-0.5 text-[10px] text-text-muted">
                      {item.type === "delay"
                        ? "Delay"
                        : item.type === "approval"
                        ? "Approval"
                        : "Update"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}