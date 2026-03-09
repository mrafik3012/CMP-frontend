// MODIFIED: 2026-03-03 - Redesigned notifications page with filters and cards

/**
 * Notifications page. Shows unread notifications and allows marking them read.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../api/client";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { IconAlertTriangle } from "../../components/icons";
import { formatRelativeTime } from "../../utils/format";
import type { NotificationItem } from "../../types";
import { useToast } from "../../components/common/Toast";

type FilterTab = "All" | "Unread" | "Tasks" | "Budget" | "RFIs" | "System";

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [tab, setTab] = useState<FilterTab>("All");

  const {
    data,
    isLoading,
    isError,
  } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", "all"],
    queryFn: () =>
      notificationsApi.unread()
        .then((r) => r.data)
        .catch(() => []),
  });

  if (isError) {
    toastError("Error loading notifications");
  }

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "all"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "all"] });
    },
  });

  const all = data ?? [];

  const filtered = all.filter((n: any) => {
    const type = n.type ?? "system";
    if (tab === "Unread") return !n.is_read;
    if (tab === "Tasks") return type === "task";
    if (tab === "Budget") return type === "budget";
    if (tab === "RFIs") return type === "rfi";
    if (tab === "System") return type === "system";
    return true;
  });

  const handleClick = (n: NotificationItem & { link_url?: string }) => {
    const link = (n as any).link_url ?? (n as any).link;
    markRead.mutate(n.id);
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Notifications" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">
          Notifications
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || all.length === 0}
        >
          Mark all read
        </Button>
      </header>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-1 text-xs">
        {["All", "Unread", "Tasks", "Budget", "RFIs", "System"].map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-md px-3 py-1.5 ${
              tab === t
                ? "bg-surface-card text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
            onClick={() => setTab(t as FilterTab)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading notifications...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconAlertTriangle />}
          title="All caught up!"
          description="No notifications yet"
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n: any) => {
            const type = n.type ?? "system";
            const dotColor =
              type === "task"
                ? "bg-accent-secondary"
                : type === "budget"
                ? "bg-status-warning"
                : type === "rfi"
                ? "bg-status-error"
                : "bg-border-subtle";
            return (
              <button
                key={n.id}
                type="button"
                className={`flex w-full items-start gap-4 rounded-xl border border-border-subtle bg-surface-card p-4 text-left text-sm hover:bg-surface-hover ${
                  !n.is_read ? "border-l-2 border-l-accent-primary" : ""
                }`}
                onClick={() => handleClick(n)}
              >
                <div className="mt-2 flex h-2 w-2 flex-shrink-0 items-center justify-center">
                  <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm ${
                      !n.is_read
                        ? "font-medium text-text-primary"
                        : "text-text-primary"
                    }`}
                  >
                    {n.message}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    {formatRelativeTime(n.created_at)}
                  </div>
                </div>
                {!n.is_read && (
                  <div className="mt-2 flex h-2 w-2 flex-shrink-0 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-status-info" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

