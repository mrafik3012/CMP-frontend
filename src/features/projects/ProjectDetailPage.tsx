// MODIFIED: 2026-03-04 - Added full project tab navigation

import { useParams, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { IconDownload, IconEdit } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { formatCurrency, formatDate } from "../../utils/format";
import { useAuthStore } from "../../stores/authStore";

const TAB_BASE =
  "px-3 py-2 text-sm font-medium border-b-2 border-transparent text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap";
const TAB_ACTIVE =
  "border-brand-primary text-text-primary";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const canEdit = user?.role === "Admin" || user?.role === "Project Manager";
  const role = user?.role ?? "";

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", pid],
    enabled: Number.isFinite(pid),
    queryFn: () => projectsApi.get(pid).then((r) => r.data),
  });

  if (!Number.isFinite(pid)) {
    return <div className="p-6 text-status-danger">Invalid project ID.</div>;
  }

  if (isError) toastError("Failed to load project");

  const handleExportPDF = async () => {
    try {
      const res = await fetch(`/api/v1/projects/${pid}/report/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${pid}-summary.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toastSuccess("Export started");
    } catch {
      toastError("Failed to export PDF");
    }
  };

  const tabs = [
    { to: `/projects/${pid}/tasks`, label: "📋 Tasks", roles: ["Admin", "Project Manager", "Site Engineer", "Viewer"] },
    { to: `/projects/${pid}/budget`, label: "💰 Budget", roles: ["Admin", "Project Manager", "Viewer"] },
    { to: `/projects/${pid}/logs`, label: "📅 Site Logs", roles: ["Admin", "Project Manager", "Site Engineer"] },
    { to: `/projects/${pid}/resources`, label: "👷 Resources", roles: ["Admin", "Project Manager", "Site Engineer"] },
    { to: `/projects/${pid}/documents`, label: "📁 Documents", roles: ["Admin", "Project Manager", "Site Engineer", "Viewer"] },
    { to: `/projects/${pid}/rfis`, label: "❓ RFIs", roles: ["Admin", "Project Manager", "Site Engineer"] },
    { to: `/projects/${pid}/punch-list`, label: "✅ Punch List", roles: ["Admin", "Project Manager", "Site Engineer"] },
    { to: `/projects/${pid}/checklists`, label: "🔍 Checklists", roles: ["Admin", "Project Manager", "Site Engineer"] },
    { to: `/projects/${pid}/change-orders`, label: "📝 Change Orders", roles: ["Admin", "Project Manager"] },
    { to: `/projects/${pid}/reports`, label: "📊 Reports", roles: ["Admin", "Project Manager"] },
  ].filter((t) => t.roles.includes(role));

  return (
    <div className="space-y-0">
      <PageTitle title="Project" />

      {/* Project header */}
      <div className="border-b border-surface-border bg-surface-card px-6 pb-0 pt-5">
        {isLoading || !project ? (
          <p className="pb-4 text-sm text-text-secondary">Loading project...</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 pb-1">
              <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
              <Badge status={project.status} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-secondary pb-3 items-center">
              <span>{project.client_name}</span>
              <span className="text-text-muted">·</span>
              <span>{project.location}</span>
              <span className="text-text-muted">·</span>
              <span>
                {formatDate(project.start_date)} – {formatDate(project.end_date)}
              </span>
              <span className="text-text-muted">·</span>
              <span>{formatCurrency(project.estimated_budget)}</span>
              <span className="text-text-muted">·</span>
              <span>{project.sqft.toLocaleString()} SqFt</span>
              <span className="text-text-muted">·</span>
              <span>
                {project.project_type} / {project.project_category}
              </span>
              <div className="ml-auto flex gap-2">
                {canEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/projects/${pid}/edit`)}
                  >
                    <IconEdit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleExportPDF}>
                  <IconDownload className="mr-1 h-3 w-3" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Tab nav */}
            <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    `${TAB_BASE} ${isActive ? TAB_ACTIVE : ""}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
