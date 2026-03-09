// MODIFIED: 2026-03-03 - Rebuilt navbar with role-based links, notifications dropdown, and user menu

import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useMatch,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { authApi, notificationsApi } from "../../api/client";
import { Logo } from "../common/Logo";
import { useToast } from "../common/Toast";
import {
  IconAlertTriangle,
  IconBell,
  IconHome,
  IconMenu,
  IconUsers,
  IconBarChart,
} from "../icons";
import { IconMoon, IconSun } from "../icons";
import { formatRelativeTime, getInitials } from "../../utils/format";
import type { NotificationItem } from "../../types";
import { useTheme } from "../../theme/ThemeContext";

const NAV_LINK_BASE =
  "px-3 py-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors border-b-2 border-transparent";
const NAV_LINK_ACTIVE =
  "text-text-primary border-accent-primary";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout: clearUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await notificationsApi.unread();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = window.setInterval(fetchNotifications, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error(err);
    } finally {
      clearUser();
      queryClient.clear();
      navigate("/login");
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    try {
      if (!n.is_read) {
        await notificationsApi.markRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      }
    } catch (err) {
      console.error(err);
    }
    const link = (n as any).link_url ?? n.link;
    if (link) {
      navigate(link);
    }
    setNotifOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
      toastError("Failed to mark notifications as read");
    }
  };

  const role = user?.role;

  const dashboardMatch = useMatch("/dashboard");
  const projectsMatch = useMatch("/projects/*");
  const usersMatch = useMatch("/users");
  const reportsMatch = useMatch("/reports");

  const initials = getInitials(user?.name ?? user?.email ?? "");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle bg-surface-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
            onClick={toggleTheme}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-surface-card text-text-secondary shadow-sm transition-all hover:scale-105 hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
          >
            <span className="sr-only">Toggle theme</span>
            <span
              className="inline-flex items-center justify-center transition-transform duration-300 ease-in-out"
              style={{ transform: theme === "dark" ? "rotate(0deg)" : "rotate(180deg)" }}
            >
              {theme === "dark" ? (
                <IconMoon className="h-4 w-4" />
              ) : (
                <IconSun className="h-4 w-4" />
              )}
            </span>
          </button>
          <Logo size="sm" />
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${NAV_LINK_BASE} ${isActive || dashboardMatch ? NAV_LINK_ACTIVE : ""}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `${NAV_LINK_BASE} ${isActive || projectsMatch ? NAV_LINK_ACTIVE : ""}`
            }
          >
            Projects
          </NavLink>

          {role === "Admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `${NAV_LINK_BASE} ${isActive || usersMatch ? NAV_LINK_ACTIVE : ""}`
              }
            >
              Users
            </NavLink>
          )}
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `${NAV_LINK_BASE} ${isActive || reportsMatch ? NAV_LINK_ACTIVE : ""}`
            }
          >
            Reports
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div ref={notifRef} className="relative">
            <button
              type="button"
              className="relative rounded-md p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              onClick={() => setNotifOpen((v) => !v)}
            >
              <IconBell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-[10px] text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border-default bg-surface-elevated shadow-modal">
                <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
                  <span className="text-sm font-semibold text-text-primary">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-xs font-medium text-brand-accent hover:underline"
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="px-4 py-3 text-sm text-text-secondary">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-secondary">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const type = (n as any).type ?? "system";
                      const dotColor =
                        type === "task"
                          ? "bg-status-info"
                          : type === "budget"
                          ? "bg-status-warning"
                          : type === "rfi"
                          ? "bg-status-danger"
                          : "bg-surface-border";
                      return (
                        <button
                          key={n.id}
                          type="button"
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-surface-hover ${
                            n.is_read ? "" : "bg-surface-hover/50"
                          }`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <span
                            className={`mt-1 h-2 w-2 rounded-full ${dotColor}`}
                          />
                          <div className="flex-1">
                            <div className="text-text-primary">
                              {n.message}
                            </div>
                            <div className="mt-1 text-xs text-text-muted">
                              {formatRelativeTime(n.created_at)}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border-subtle px-4 py-2 text-right">
                  <Link
                    to="/notifications"
                    className="text-xs font-medium text-brand-accent hover:underline"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-divider" />

          <div ref={userMenuRef} className="relative">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-xs font-semibold text-text-inverse transition-all hover:scale-105 hover:shadow-glow"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              {initials || "U"}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border-default bg-surface-elevated shadow-modal">
                <div className="border-b border-border-subtle px-4 py-3">
                  <div className="text-sm font-semibold text-text-primary">
                    {user?.name || user?.email}
                  </div>
                  <div className="text-xs text-text-muted">
                    {user?.email}
                  </div>
                </div>
                <div className="px-2 py-1">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    <span>Edit Profile</span>
                  </button>
                </div>
                <div className="mt-1 border-t border-border-subtle px-2 py-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-status-danger hover:bg-surface-hover"
                    onClick={handleLogout}
                  >
                    <IconAlertTriangle className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary md:hidden"
          >
            <IconMenu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}