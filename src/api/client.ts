// MODIFIED: 2026-03-03 - Added basic request interceptor while preserving JWT refresh logic
/**
 * Axios client with JWT refresh. FR-AUTH-001: tokens in cookies or header.
 */
import axios, { AxiosError } from "axios";

// In dev: use relative path so Vite proxy (vite.config.ts) forwards to backend (avoids CORS/404).
// Backend must run: cd backend && uvicorn app.main:app --reload --port 8000
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // Attach a hint header so backend can distinguish AJAX calls, if needed.
  config.headers = config.headers ?? {};
  (config.headers as any)["X-Requested-With"] = "XMLHttpRequest";
  return config;
});

// Track if a refresh is already in progress to prevent parallel refresh calls
let _isRefreshing = false;
let _failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  _failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)));
  _failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as any;

    // Don't retry refresh/login/logout endpoints — avoids infinite loops
    const url = original?.url ?? "";
    if (url.includes("/auth/refresh") || url.includes("/auth/logout") || url.includes("/auth/verify-login-otp")) {
      if (url.includes("/auth/refresh")) {
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        }).then(() => api(original)).catch((e) => Promise.reject(e));
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        await axios.post(baseURL + "/auth/refresh", {}, { withCredentials: true });
        processQueue(null);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export const authApi = {
  /** Primary login: send OTP to phone */
  sendLoginOtp: (phone: string) =>
    api.post<{ message: string }>("/auth/send-login-otp", { phone }),
  /** Primary login: verify OTP and get tokens */
  verifyLoginOtp: (phone: string, otp: string, rememberMe: boolean) =>
    api.post<TokenResponse>("/auth/verify-login-otp", {
      phone,
      otp,
      remember_me: rememberMe,
    }),
  /** Signup: verify OTP after register → activate and log in */
  verifySignupOtp: (phone: string, otp: string) =>
    api.post<TokenResponse>("/auth/verify-signup-otp", { phone, otp }),
  me: () => api.get<User>("/auth/me"),
  refresh: () => api.post<TokenResponse>("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
};

export const usersApi = {
  list: (params?: { skip?: number; limit?: number }) =>
    api.get<User[]>("/users", { params }),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: Omit<User, "id" | "created_at" | "updated_at">) =>
    api.post<User>("/users", data),
  update: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const projectsApi = {
  list: (params?: { skip?: number; limit?: number; status?: string; client?: string }) =>
    api.get<Project[]>("/projects", { params }),
  get: (id: number) => api.get<Project>(`/projects/${id}`),
  getDashboard: (id: number) => api.get<ProjectDashboardStats>(`/projects/${id}/dashboard`),
  create: (data: Partial<Project>) => api.post<Project>("/projects", data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addMember: (projectId: number, userId: number, role: string) =>
    api.post(`/projects/${projectId}/members`, { user_id: userId, role_in_project: role }),
  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

export const tasksApi = {
  list: (projectId: number) => api.get<Task[]>(`/projects/${projectId}/tasks`),
  get: (taskId: number) => api.get<Task>(`/tasks/${taskId}`),
  create: (projectId: number, data: Partial<Task>) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data),
  update: (taskId: number, data: Partial<Task>) =>
    api.put<Task>(`/tasks/${taskId}`, data),
  delete: (taskId: number) => api.delete(`/tasks/${taskId}`),
  assign: (taskId: number, assigneeId: number) =>
    api.post<Task>(`/tasks/${taskId}/assign`, { assignee_id: assigneeId }),
  gantt: (projectId: number) =>
    api.get<GanttTaskItem[]>(`/projects/${projectId}/gantt`),
  exportPdf: (projectId: number) =>
    api.get<Blob>(`/projects/${projectId}/tasks/export/pdf`, { responseType: "blob" }),
};

export const budgetApi = {
  list: (projectId: number) => api.get<BudgetItemResponse[]>(`/projects/${projectId}/budget`),
  create: (projectId: number, data: Partial<BudgetItemResponse>) =>
    api.post<BudgetItemResponse>(`/projects/${projectId}/budget`, data),
  update: (itemId: number, data: Partial<BudgetItemResponse>) =>
    api.put<BudgetItemResponse>(`/budget/${itemId}`, data),
  delete: (itemId: number) => api.delete(`/budget/${itemId}`),
  summary: (projectId: number) =>
    api.get<{ categories: string[]; estimated: number[]; actual: number[]; variance: number[] }>(
      `/projects/${projectId}/budget/summary`
    ),
  changeOrderList: (projectId: number) =>
    api.get(`/projects/${projectId}/change-orders`),
  changeOrderCreate: (projectId: number, data: { description: string; cost_impact: number; justification: string }) =>
    api.post(`/projects/${projectId}/change-orders`, data),
  exportCsv: (projectId: number) =>
    api.get<Blob>(`/projects/${projectId}/budget/export/csv`, { responseType: "blob" }),
  exportPdf: (projectId: number) =>
    api.get<Blob>(`/projects/${projectId}/budget/export/pdf`, { responseType: "blob" }),
};

export const notificationsApi = {
  unread: () => api.get<NotificationItem[]>("/notifications/unread"),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard"),
};

export const resourcesApi = {
  workers: () => api.get("/resources/workers"),
  createWorker: (data: any) => api.post("/resources/workers", data),
  updateWorker: (id: number, data: any) => api.put(`/resources/workers/${id}`, data),
  deleteWorker: (id: number) => api.delete(`/resources/workers/${id}`),
  equipment: () => api.get("/resources/equipment"),
  createEquipment: (data: any) => api.post("/resources/equipment", data),
  updateEquipment: (id: number, data: any) => api.put(`/resources/equipment/${id}`, data),
  deleteEquipment: (id: number) => api.delete(`/resources/equipment/${id}`),
};

export const documentsApi = {
  listByProject: (projectId: number) => api.get(`/projects/${projectId}/documents`),
  uploadToProject: (projectId: number, formData: FormData) =>
    api.post(`/projects/${projectId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  download: (id: number) =>
    api.get(`/projects/documents/${id}/download`, { responseType: "blob" }),
  delete: (id: number) => api.delete(`/projects/documents/${id}`),
};

export const logsApi = {
  listByProject: (projectId: number) => api.get(`/projects/${projectId}/logs`),
  create: (projectId: number, data: any) => api.post(`/projects/${projectId}/logs`, data),
  getByDate: (projectId: number, date: string) => api.get(`/projects/${projectId}/logs/${date}`),
  update: (logId: number, data: any) => api.put(`/projects/logs/${logId}`, data),
  uploadPhoto: (projectId: number, date: string, file: File, caption: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", caption);
    return api.post(`/projects/${projectId}/logs/${date}/photos`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getPhotos: (projectId: number, date: string) =>
    api.get(`/projects/${projectId}/logs/${date}/photos`),
  deletePhoto: (projectId: number, date: string, photoId: number) =>
    api.delete(`/projects/${projectId}/logs/${date}/photos/${photoId}`),
  exportPdf: (logId: number) =>
    api.get(`/projects/logs/${logId}/export/pdf`, { responseType: "blob" }),
};

export const checklistsApi = {
  list: (projectId: number) =>
    api.get(`/projects/${projectId}/checklists`),
  create: (projectId: number, data: { title: string; checklist_type: string; custom_items?: string[] }) =>
    api.post(`/projects/${projectId}/checklists`, data),
  updateItem: (projectId: number, checklistId: number, itemId: number, data: { is_checked?: boolean; notes?: string }) =>
    api.patch(`/projects/${projectId}/checklists/${checklistId}/items/${itemId}`, data),
  delete: (projectId: number, checklistId: number) =>
    api.delete(`/projects/${projectId}/checklists/${checklistId}`),
};

export const punchListApi = {
  list: (projectId: number, params?: { status?: string; priority?: string }) =>
    api.get(`/projects/${projectId}/punch-list`, { params }),
  create: (projectId: number, data: any) =>
    api.post(`/projects/${projectId}/punch-list`, data),
  update: (projectId: number, itemId: number, data: any) =>
    api.patch(`/projects/${projectId}/punch-list/${itemId}`, data),
  delete: (projectId: number, itemId: number) =>
    api.delete(`/projects/${projectId}/punch-list/${itemId}`),
  uploadPhoto: (projectId: number, itemId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/projects/${projectId}/punch-list/${itemId}/photo`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const reportsApi = {
  listDaily: (projectId: number, params?: { from_date?: string; to_date?: string }) =>
    api.get(`/projects/${projectId}/reports/daily`, { params }),
  /** Generate daily report PDF from existing data (no form). Uses saved report for date if any, else tasks + workers. */
  exportDailyPdf: (projectId: number, reportDate: string) =>
    api.get(`/projects/${projectId}/reports/daily/pdf`, { params: { report_date: reportDate }, responseType: "blob" }),
  get: (reportId: number) => api.get(`/reports/${reportId}`),
  createDaily: (projectId: number, data: DailyReportCreatePayload) =>
    api.post(`/projects/${projectId}/reports/daily`, data),
  update: (reportId: number, data: DailyReportUpdatePayload) =>
    api.put(`/reports/${reportId}`, data),
  submit: (reportId: number) => api.post(`/reports/${reportId}/submit`),
  exportPdf: (reportId: number) =>
    api.get(`/reports/${reportId}/export/pdf`, { responseType: "blob" }),
  /** Weekly report PDF for 7-day period (no form). week_start = Monday YYYY-MM-DD. */
  exportWeeklyPdf: (projectId: number, weekStart: string) =>
    api.get(`/projects/${projectId}/reports/weekly/pdf`, { params: { week_start: weekStart }, responseType: "blob" }),
  /** Monthly report PDF (no form). */
  exportMonthlyPdf: (projectId: number, year: number, month: number) =>
    api.get(`/projects/${projectId}/reports/monthly/pdf`, { params: { year, month }, responseType: "blob" }),
  uploadPhoto: (reportId: number, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", caption ?? "");
    return api.post(`/reports/${reportId}/photos`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export type DailyReportCreatePayload = {
  report_type: "daily";
  report_date: string;
  weather?: string | null;
  temperature?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
  notes?: string | null;
  workforce: { trade: string; present: number; absent: number; total: number }[];
  work_items: { task_name: string; location?: string; boq_item?: string; progress_today: number; progress_cumulative: number }[];
  materials: { item_name: string; quantity?: string; supplier?: string; status?: string }[];
  issues: { issue_type?: string; description: string; impact?: string; responsible_party?: string; status?: string }[];
};

export type DailyReportUpdatePayload = Partial<DailyReportCreatePayload> & { status?: string };

/** Draft from GET daily-draft: same shape as create payload minus report_type. */
export type DailyReportDraft = Omit<DailyReportCreatePayload, "report_type">;

export const rfisApi = {
  listByProject: (projectId: number) => api.get(`/projects/${projectId}/rfis`),
  create: (projectId: number, data: any) => api.post(`/projects/${projectId}/rfis`, data),
  get: (id: number) => api.get(`/projects/rfis/${id}`),
  update: (id: number, data: any) => api.put(`/projects/rfis/${id}`, data),
  delete: (id: number) => api.delete(`/projects/rfis/${id}`),
};

import type {
  User,
  Project,
  ProjectDashboardStats,
  Task,
  DashboardOverview,
  NotificationItem,
  TokenResponse,
  BudgetItemResponse,
  GanttTaskItem,
} from "../types";
