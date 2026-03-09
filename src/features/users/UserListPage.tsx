// MODIFIED: 2026-03-03 - Redesigned users page with filters, roles, status, and modals

/**
 * User list page. Admin only. Uses /users API.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { api, usersApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { IconSlash, IconUsers, IconCheckCircle } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { getInitials } from "../../utils/format";

const ACCESS_ROLES = ["Admin", "Project Manager", "Site Engineer", "Viewer"] as const;
const PERSONA_ROLES = [
  "contractor",
  "homeowner",
  "architect",
  "subcontractor",
  "project_manager",
  "consultant",
] as const;

const personaLabel: Record<string, string> = {
  contractor: "Contractor",
  homeowner: "Home Owner",
  architect: "Architect/Designer",
  subcontractor: "Subcontractor",
  project_manager: "Project Manager",
  consultant: "Consultant",
};

function getAccessRoleLabel(rawRole: string): string {
  if (ACCESS_ROLES.includes(rawRole as (typeof ACCESS_ROLES)[number])) {
    return rawRole;
  }
  // Default access level for persona-only users
  return "Viewer";
}

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Email must be a valid email"),
  role: z.enum(["Admin", "Project Manager", "Site Engineer", "Viewer"], {
    required_error: "Role is required",
  }),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[\d\s+-]{10,20}$/.test(v),
      "Enter a valid phone (digits, +, spaces)",
    ),
});

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["Admin", "Project Manager", "Site Engineer", "Viewer"], {
    required_error: "Role is required",
  }),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{10}$/.test(v),
      "Phone must be 10 digits",
    ),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

export function UserListPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  async function exportUsers() {
    try {
      const res = await api.get("/users/export/csv", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toastError("Failed to export users");
    }
  }

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "All" | "Admin" | "Project Manager" | "Site Engineer" | "Viewer"
  >("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  if (isError) {
    toastError("Error loading users");
  }

  const isAdmin = currentUser?.role === "Admin";

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchesRole =
        roleFilter === "All" ? true : u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "Viewer" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      usersApi
        .create({
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone ?? undefined,
        } as any)
        .then((r) => r.data),
    onSuccess: () => {
      toastSuccess("User created");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setCreateOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<any>;
      const status = axiosErr.response?.status;
      const data = axiosErr.response?.data as any;

      if (status === 400) {
        setError("email", {
          type: "server",
          message: data?.detail || "Email already registered",
        });
        return;
      }

      toastError("Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: { id: number; data: EditUserFormData }) =>
      usersApi.update(payload.id, payload.data as any).then((r) => r.data),
    onSuccess: () => {
      toastSuccess("User updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditUser(null);
      resetEdit();
    },
    onError: () => {
      toastError("Failed to update user");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) =>
      usersApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      toastSuccess("User deactivated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      toastError("Failed to deactivate user");
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) =>
      // ⚠️ BACKEND NEEDED: PUT /api/v1/users/{id} { is_active: true }
      usersApi.update(id, { is_active: true } as any).then((r) => r.data),
    onSuccess: () => {
      toastSuccess("User activated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      toastError("Failed to activate user");
    },
  });

  const onCreateSubmit = (data: CreateUserFormData) => {
    if (!isAdmin) {
      toastError("You don't have permission");
      return;
    }
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: EditUserFormData) => {
    if (!isAdmin || !editUser) {
      toastError("You don't have permission");
      return;
    }
    updateUserMutation.mutate({ id: editUser.id, data });
  };

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Users" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <span className="text-sm text-text-secondary">
            {filteredUsers.length} users total
          </span>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportUsers}
            >
              ↓ Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateOpen(true)}
              data-testid="add-user-btn"
            >
              + Add User
            </Button>
          </div>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="user-search-input"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Role</span>
          <select
            className="h-9 rounded-md border border-surface-border bg-surface-base px-3 text-xs text-text-primary focus:border-brand-primary focus:outline-none"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value as
                  | "All"
                  | "Admin"
                  | "Project Manager"
                  | "Site Engineer"
                  | "Viewer",
              )
            }
            data-testid="role-filter-dropdown"
          >
            <option value="All">All</option>
            <option value="Admin">Admin</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Site Engineer">Site Engineer</option>
            <option value="Viewer">Viewer</option>
          </select>
        </label>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card"
        data-testid="users-table"
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-elevated">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Persona</th>
              <th className="px-4 py-2">Access Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  data-testid={`user-row-${u.id}`}
                  className="border-t border-surface-border"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-text-inverse">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {u.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-text-secondary">
                    {u.email}
                  </td>
                  <td className="px-4 py-2 text-sm text-text-secondary">
                    {u.phone || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {PERSONA_ROLES.includes(u.role as (typeof PERSONA_ROLES)[number]) ? (
                      <Badge status="Active">
                        {personaLabel[u.role] ?? u.role}
                      </Badge>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-text-secondary">
                    {getAccessRoleLabel(u.role)}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <Badge status={u.is_active ? "Active" : "Inactive"} />
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            className="hover:text-text-primary"
                            data-testid={`edit-user-btn-${u.id}`}
                            onClick={() => {
                              setEditUser(u);
                              resetEdit({
                                name: u.name,
                                role: u.role,
                                phone: u.phone ?? "",
                              });
                            }}
                          >
                            Edit
                          </button>
                          {u.id !== currentUser?.id && (
                            <>
                              {u.is_active ? (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-status-danger hover:text-status-danger/80"
                                  data-testid={`deactivate-btn-${u.id}`}
                                  onClick={() =>
                                    deactivateMutation.mutate(u.id)
                                  }
                                >
                                  <IconSlash className="h-3 w-3" />
                                  <span>Deactivate</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-status-success hover:text-status-success/80"
                                  data-testid={`activate-btn-${u.id}`}
                                  onClick={() =>
                                    activateMutation.mutate(u.id)
                                  }
                                >
                                  <IconCheckCircle className="h-3 w-3" />
                                  <span>Activate</span>
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && (!users || users.length === 0) && (
        <EmptyState
          icon={<IconUsers />}
          title="No users"
          description="Create users to grant access to the workspace."
        />
      )}

      {/* Create user modal */}
      {createOpen && (
        <Modal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add User"
          size="md"
        >
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-3">
            <FormField
              label="Name"
              required
              error={errors.name?.message}
            >
              <Input {...register("name")} />
            </FormField>
            <FormField
              label="Email"
              required
              error={errors.email?.message}
            >
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label="Phone (optional)" error={errors.phone?.message}>
              <Input type="tel" placeholder="+91 9876543210" {...register("phone")} />
            </FormField>
            <FormField
              label="Role"
              required
              error={errors.role?.message}
            >
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("role")}
              >
                <option value="Admin">Admin</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Site Engineer">Site Engineer</option>
                <option value="Viewer">Viewer</option>
              </select>
            </FormField>
            <FormField
              label="Phone"
              error={errors.phone?.message}
            >
              <Input {...register("phone")} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={createUserMutation.isPending}
                disabled={createUserMutation.isPending}
              >
                Create User
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit user modal */}
      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title="Edit User"
          size="md"
        >
          <form
            onSubmit={handleSubmitEdit(onEditSubmit)}
            className="space-y-3"
          >
            <FormField
              label="Name"
              required
              error={editErrors.name?.message}
            >
              <Input {...registerEdit("name")} />
            </FormField>
            <FormField label="Email">
              <Input value={editUser.email} disabled />
            </FormField>
            <FormField
              label="Role"
              required
              error={editErrors.role?.message}
            >
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...registerEdit("role")}
              >
                <option value="Admin">Admin</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Site Engineer">Site Engineer</option>
                <option value="Viewer">Viewer</option>
              </select>
            </FormField>
            <FormField
              label="Phone"
              error={editErrors.phone?.message}
            >
              <Input {...registerEdit("phone")} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={updateUserMutation.isPending}
                disabled={updateUserMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}

