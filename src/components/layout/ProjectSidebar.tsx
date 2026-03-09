// MODIFIED: 2026-03-03 - Added project-level sidebar navigation

import type React from "react";
import { Link, useParams } from "react-router-dom";
import {
  IconAlertTriangle,
  IconBarChart,
  IconCalendar,
  IconDownload,
  IconHome,
  IconUsers,
  IconCheck,
  IconDollar,
} from "../icons";

interface ProjectSidebarProps {
  projectId?: string;
  activePage: string;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projectId,
  activePage,
}) => {
  const params = useParams<{ id: string }>();
  const id = projectId ?? params.id ?? "";

  const baseItem =
    "flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary cursor-pointer";
  const activeItem =
    "text-brand-primary bg-brand-primary/5 border-l-2 border-brand-primary font-medium";

  const items: Array<{
    key: string;
    label: string;
    to: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }> = [
    { key: "overview", label: "Overview", to: `/projects/${id}`, Icon: IconHome },
    { key: "tasks", label: "Tasks", to: `/projects/${id}/tasks`, Icon: IconCheck },
    { key: "budget", label: "Budget", to: `/projects/${id}/budget`, Icon: IconDollar },
    {
      key: "resources",
      label: "Resources",
      to: `/projects/${id}/resources`,
      Icon: IconUsers,
    },
    {
      key: "documents",
      label: "Documents",
      to: `/projects/${id}/documents`,
      Icon: IconDownload,
    },
    {
      key: "logs",
      label: "Site Logs",
      to: `/projects/${id}/logs`,
      Icon: IconCalendar,
    },
    {
      key: "rfis",
      label: "RFIs",
      to: `/projects/${id}/rfis`,
      Icon: IconAlertTriangle,
    },
    {
      key: "reports",
      label: "Reports",
      to: `/projects/${id}/reports`,
      Icon: IconBarChart,
    },
  ];

  return (
    <aside className="hidden h-full w-60 shrink-0 border-r border-surface-border bg-surface-card md:block">
      <nav className="py-4">
        {items.map(({ key, label, to, Icon }) => (
          <Link key={key} to={to} className="block">
            <div className={`${baseItem} ${activePage === key ? activeItem : ""}`}>
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

