/** Shared types matching backend schemas. */

export type UserRole = "Admin" | "Project Manager" | "Site Engineer" | "Viewer";

export interface User {
  id: number;
  name: string;
  full_name?: string; // Added to match UI usage
  email: string | null;
  role: UserRole;
  phone?: string | null;
  profile_picture?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";
export type ProjectType = "Residential" | "Commercial" | "Industrial" | "Infrastructure";
export type ProjectCategory =
  | "Construction"
  | "Interior"
  | "Renovation"
  | "Smart Automation"
  | "Roofing"
  | "PEB";

export interface Project {
  id: number;
  name: string;
  client_name: string;
  location: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
   sqft: number;
   project_type: ProjectType;
   project_category: ProjectCategory;
  status: ProjectStatus;
  description?: string;
  archived: boolean;
  is_deleted: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectDashboardStats {
  progress_percent: number;
  budget_burn_percent: number;
  overdue_tasks_count: number;
  last_updated: string;
}

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "Not Started" | "In Progress" | "Blocked" | "Done" | "Delayed"; // Added Delayed

export interface Task {
  id: number;
  project_id: number;
  parent_task_id?: number;
  title: string;
  description?: string;
  assignee_id?: number | null; // Allow null to match API usage
  start_date: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencies?: number[];
  estimated_hours?: number;
  actual_hours?: number;
  is_critical_path: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardOverview {
  active_projects_count: number;
  overdue_tasks_count: number;
  total_budget_committed: number;
  total_actual_spent: number;
  upcoming_deadlines: { id: number; title: string; due_date: string; project_id: number }[];
  // Added missing properties from build errors
  recent_activity?: any[];
  on_track_projects_count?: number;
  at_risk_projects_count?: number;
  on_track_percentage?: number;
  completed_milestones_count?: number;
  total_milestones_count?: number;
  key_milestones?: any[];
  pending_approvals_count?: number;
  in_progress_tasks_count?: number;
  delayed_tasks_count?: number;
  completed_tasks_count?: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface BudgetItemResponse {
  id: number;
  project_id: number;
  category: string;
  description?: string;
  estimated_cost: number;
  actual_cost: number;
  variance: number;
  created_at: string;
  updated_at: string;
}

export interface GanttTaskItem {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  is_critical_path: boolean;
  dependencies?: number[];
}
