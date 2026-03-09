// MODIFIED: 2026-03-03 - Added ToastProvider, ErrorBoundary, and kept existing routes

/**
 * Root app with router and auth. Section 7.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";
import { NotFoundPage } from "./features/errors/NotFoundPage";
import { EditProfilePage } from "./features/profile/EditProfilePage";
import { SignupPage } from "./features/auth/SignupPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ProjectListPage } from "./features/projects/ProjectListPage";
import { ProjectCreatePage } from "./features/projects/ProjectCreatePage";
import { ProjectEditPage } from "./features/projects/ProjectEditPage";
import { ProjectDetailPage } from "./features/projects/ProjectDetailPage";
import { UserListPage } from "./features/users/UserListPage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { ProjectTasksPage } from "./features/tasks/ProjectTasksPage";
import { ProjectBudgetPage } from "./features/budget/ProjectBudgetPage";
import { ProjectChangeOrdersPage } from "./features/budget/ProjectChangeOrdersPage";
import { ResourcesPage } from "./features/resources/ResourcesPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { SiteLogsPage } from "./features/logs/SiteLogsPage";
import { RFIsPage } from "./features/rfis/RFIsPage";
import { PunchListPage } from "./features/punchlist/PunchListPage";
import { ChecklistsPage } from "./features/checklists/ChecklistsPage";
import { ReportsPage } from "./features/reports/ReportsPage";
import { useAuthRestore } from "./lib/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastProvider } from "./components/common/Toast";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>{children}</AppLayout>
  );
}

function AuthRestore() {
  useAuthRestore();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthRestore />
            <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><DashboardPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout><ProjectListPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Project Manager"]}>
                <Layout><ProjectCreatePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <Layout><ProjectDetailPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/edit"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Project Manager"]}>
                <Layout><ProjectEditPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/tasks"
            element={
              <ProtectedRoute>
                <Layout><ProjectTasksPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/budget"
            element={
              <ProtectedRoute>
                <Layout><ProjectBudgetPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/resources"
            element={
              <ProtectedRoute>
                <Layout><ResourcesPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/documents"
            element={
              <ProtectedRoute>
                <Layout><DocumentsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/logs"
            element={
              <ProtectedRoute>
                <Layout><SiteLogsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/checklists"
            element={
              <ProtectedRoute>
                <Layout><ChecklistsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/punch-list"
            element={
              <ProtectedRoute>
                <Layout><PunchListPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/rfis"
            element={
              <ProtectedRoute>
                <Layout><RFIsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/reports"
            element={
              <ProtectedRoute>
                <Layout><ReportsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/change-orders"
            element={
              <ProtectedRoute>
                <Layout><ProjectChangeOrdersPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Layout><UserListPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Layout><ResourcesPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout><ReportsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout><NotificationsPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<Navigate to="/profile/edit" replace />} />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <Layout><EditProfilePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
}
