// MODIFIED: 2026-03-03 - Added RFIs page with table and modal

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonRow } from "../../components/common/Skeleton";
import { Modal } from "../../components/common/Modal";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import { IconAlertTriangle } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { rfisApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import { formatDate } from "../../utils/format";

interface RFI {
  id: number;
  project_id: number;
  title: string;
  description: string;
  assigned_to: number;
  raised_by: number;
  due_date: string;
  status: "Open" | "Pending Response" | "Closed" | string;
  response?: string | null;
}

const rfiSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  assigned_to: z
    .string()
    .min(1, "Assignee is required")
    .transform((v) => Number(v)),
  due_date: z.string().min(1, "Due date is required"),
});

type RFIFormData = z.infer<typeof rfiSchema>;

export function RFIsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const canManage =
    role === "Admin" || role === "Project Manager";

  const [modalOpen, setModalOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
  } = useQuery<RFI[]>({
    queryKey: ["rfis", pid],
    enabled: Number.isFinite(pid),
    queryFn: () =>
      rfisApi.listByProject(pid).then((r) => r.data as RFI[]),
  });

  if (isError) {
    toastError("Failed to load RFIs");
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RFIFormData>({
    resolver: zodResolver(rfiSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: RFIFormData) =>
      rfisApi.create(pid, data as any),
    onSuccess: () => {
      toastSuccess("RFI created");
      queryClient.invalidateQueries({ queryKey: ["rfis", pid] });
      setModalOpen(false);
      reset();
    },
    onError: () => {
      toastError("Failed to create RFI");
    },
  });

  const rfis = data ?? [];

  if (!Number.isFinite(pid)) {
    return (
      <div className="p-6 text-status-danger">
        Invalid project ID for RFIs.
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="RFIs" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">RFIs</h1>
        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            + New RFI
          </Button>
        )}
      </header>

      <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
        {isLoading ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-background-primary/80">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Raised By</th>
                <th className="px-4 py-2">Assigned To</th>
                <th className="px-4 py-2">Due</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow cols={5} />
              <SkeletonRow cols={5} />
            </tbody>
          </table>
        ) : rfis.length === 0 ? (
          <EmptyState
            icon={<IconAlertTriangle />}
            title="No RFIs"
            description="Create a new Request for Information for this project"
          />
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-background-primary/80">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Raised By</th>
                <th className="px-4 py-2">Assigned To</th>
                <th className="px-4 py-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {rfis.map((rfi) => {
                const overdue =
                  new Date(rfi.due_date) < new Date() &&
                  rfi.status !== "Closed";
                return (
                  <tr
                    key={rfi.id}
                    className={`border-t border-border-subtle ${
                      overdue ? "bg-status-error/5" : "hover:bg-surface-hover"
                    }`}
                  >
                    <td className="px-4 py-2 text-text-primary">
                      {rfi.title}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      {rfi.status}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      User #{rfi.raised_by}
                    </td>
                    <td className="px-4 py-2 text-xs text-text-secondary">
                      User #{rfi.assigned_to}
                    </td>
                    <td
                      className={`px-4 py-2 text-xs ${
                        overdue ? "text-status-danger" : "text-text-secondary"
                      }`}
                    >
                      {formatDate(rfi.due_date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="New RFI"
          size="md"
        >
          <form
            onSubmit={handleSubmit((d) => createMutation.mutate(d))}
            className="space-y-3"
          >
            <FormField
              label="Title"
              required
              error={errors.title?.message}
            >
              <Input {...register("title")} />
            </FormField>
            <FormField
              label="Description"
              required
              error={errors.description?.message}
            >
              <textarea
                rows={3}
                className="w-full rounded-md border border-surface-border bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("description")}
              />
            </FormField>
            <FormField
              label="Assigned To (User ID)"
              required
              error={errors.assigned_to?.message}
            >
              <Input {...register("assigned_to")} />
            </FormField>
            <FormField
              label="Due Date"
              required
              error={errors.due_date?.message}
            >
              <Input type="date" {...register("due_date")} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting || createMutation.isPending}
                disabled={isSubmitting || createMutation.isPending}
              >
                Create
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

