/**
 * Project list with filters. FR-PROJ-005.
 * Dark industrial table view for all projects.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { projectsApi } from "../../api/client";
import { formatCurrency } from "../../utils/format";

const STATUS_BADGE: Record<string, string> = {
  Active: "bg-status-success/15 text-status-success",
  Planning: "bg-accent-secondary/15 text-accent-secondary",
  "On Hold": "bg-status-warning/15 text-status-warning",
  Completed: "bg-background-primary/80 text-text-muted",
  Cancelled: "bg-status-error/15 text-status-error",
};

export function ProjectListPage() {
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", page, status],
    queryFn: () =>
      projectsApi
        .list({ skip: page * limit, limit, status: status || undefined })
        .then((r) => r.data),
  });

  const hasMore = (projects?.length ?? 0) === limit;

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Projects
          </h1>
          <p className="text-sm text-text-secondary">
            Portfolio of active and historical jobs.
          </p>
        </div>
        <Link to="/projects/new">
          <button
            type="button"
            className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-accent-primaryHover"
          >
            + New project
          </button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="h-9 rounded-md border border-border-default bg-surface-card px-3 text-sm text-text-primary focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/40"
          >
            <option value="">All</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <p className="text-xs text-text-muted">
          Showing {(projects ?? []).length} projects · page {page + 1}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card shadow-card">
        {isLoading ? (
          <div className="p-6 text-sm text-text-secondary">Loading projects...</div>
        ) : (
          <table className="min-w-[900px] w-full border-collapse text-sm">
            <thead className="bg-background-primary/80">
              <tr>
                {["Name", "Client", "SqFt", "Type / Category", "Status", "Start", "Budget (INR)", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {(projects ?? []).map((p: any) => (
                <tr
                  key={p.id}
                  className="border-t border-border-subtle hover:bg-surface-hover/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/projects/${p.id}`}
                      className="font-medium text-text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-text-muted">
                      {p.location ?? "Location TBD"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.client_name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.sqft?.toLocaleString?.("en-IN") ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.project_type} / {p.project_category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[p.status] ?? "bg-background-primary/80 text-text-muted"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.start_date
                      ? format(new Date(p.start_date), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatCurrency(p.estimated_budget ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/projects/${p.id}/tasks`}
                        className="text-accent-secondary hover:underline"
                      >
                        Tasks
                      </Link>
                      <Link
                        to={`/projects/${p.id}/budget`}
                        className="text-accent-secondary hover:underline"
                      >
                        Budget
                      </Link>
                      <Link
                        to={`/projects/${p.id}/change-orders`}
                        className="text-accent-secondary hover:underline"
                      >
                        Change orders
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 text-sm text-text-secondary">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-md border border-border-default bg-background-primary px-3 py-1 text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs">Page {page + 1}</span>
        <button
          type="button"
          disabled={!hasMore}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-md border border-border-default bg-background-primary px-3 py-1 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
