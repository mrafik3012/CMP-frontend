// MODIFIED: 2026-03-03 - Added resources page with workers and equipment tabs

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { IconUsers } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { resourcesApi } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";

const workerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  trade: z.enum(
    ["Mason", "Electrician", "Plumber", "Carpenter", "General Labour", "Other"] as const,
    { required_error: "Trade is required" },
  ),
  hourly_rate: z
    .number({ invalid_type_error: "Hourly rate is required" })
    .min(0, "Hourly rate must be ≥ 0"),
  phone: z.string().optional(),
  availability: z.enum(["Available", "Assigned", "Unavailable"] as const, {
    required_error: "Availability is required",
  }),
});

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Excavator", "Crane", "Mixer", "Generator", "Other"] as const, {
    required_error: "Type is required",
  }),
  daily_cost: z
    .number({ invalid_type_error: "Daily rate is required" })
    .min(0, "Daily rate must be ≥ 0"),
  status: z.enum(
    ["Available", "Assigned", "Under Maintenance"] as const,
    { required_error: "Status is required" },
  ),
});

type WorkerFormData = z.infer<typeof workerSchema>;
type EquipmentFormData = z.infer<typeof equipmentSchema>;

type Tab = "workers" | "equipment";

export function ResourcesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const canManage = role === "Admin" || role === "Project Manager";

  const [tab, setTab] = useState<Tab>("workers");
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);

  const workersQuery = useQuery({
    queryKey: ["resources", "workers"],
    queryFn: () => resourcesApi.workers().then((r) => r.data as any[]),
  });

  const equipmentQuery = useQuery({
    queryKey: ["resources", "equipment"],
    queryFn: () => resourcesApi.equipment().then((r) => r.data as any[]),
  });

  if (workersQuery.isError || equipmentQuery.isError) {
    toastError("Failed to load resources");
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
  });

  const {
    register: registerEq,
    handleSubmit: handleSubmitEq,
    reset: resetEq,
    formState: { errors: eqErrors, isSubmitting: eqSubmitting },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
  });

  const workerMutation = useMutation({
    mutationFn: (data: WorkerFormData) =>
      resourcesApi.createWorker({
        name: data.name,
        trade: data.trade,
        hourly_rate: data.hourly_rate,
        availability: data.availability,
        phone: data.phone,
      } as any),
    onSuccess: () => {
      toastSuccess("Worker added");
      queryClient.invalidateQueries({ queryKey: ["resources", "workers"] });
      setWorkerModalOpen(false);
      reset();
    },
    onError: () => {
      toastError("Failed to add worker");
    },
  });

  const equipmentMutation = useMutation({
    mutationFn: (data: EquipmentFormData) =>
      resourcesApi.createEquipment({
        name: data.name,
        type: data.type,
        daily_cost: data.daily_cost,
        status: data.status,
      } as any),
    onSuccess: () => {
      toastSuccess("Equipment added");
      queryClient.invalidateQueries({ queryKey: ["resources", "equipment"] });
      setEquipmentModalOpen(false);
      resetEq();
    },
    onError: () => {
      toastError("Failed to add equipment");
    },
  });

  const onWorkerSubmit = (data: WorkerFormData) => {
    if (!canManage) {
      toastError("You don't have permission");
      return;
    }
    workerMutation.mutate(data);
  };

  const onEquipmentSubmit = (data: EquipmentFormData) => {
    if (!canManage) {
      toastError("You don't have permission");
      return;
    }
    equipmentMutation.mutate(data);
  };

  const renderWorkers = () => {
    const workers = workersQuery.data ?? [];
    if (workersQuery.isLoading) {
      return (
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-elevated">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Trade</th>
              <th className="px-4 py-2">Hourly Rate</th>
              <th className="px-4 py-2">Availability</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonRow cols={4} />
            <SkeletonRow cols={4} />
          </tbody>
        </table>
      );
    }
    if (workers.length === 0) {
      return (
        <EmptyState
          icon={<IconUsers />}
          title="No workers"
          description="Add workers to manage labour resources"
        />
      );
    }
    return (
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-elevated">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Trade</th>
            <th className="px-4 py-2">Hourly Rate</th>
            <th className="px-4 py-2">Availability</th>
          </tr>
        </thead>
        <tbody>
          {workers.map((w: any) => (
            <tr key={w.id} className="border-t border-surface-border">
              <td className="px-4 py-2 text-text-primary">{w.name}</td>
              <td className="px-4 py-2 text-text-secondary">{w.trade}</td>
              <td className="px-4 py-2 text-text-primary">
                ₹{w.hourly_rate?.toFixed(2) ?? "0.00"}
              </td>
              <td className="px-4 py-2 text-xs">
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-text-secondary">
                  {w.availability}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderEquipment = () => {
    const equipment = equipmentQuery.data ?? [];
    if (equipmentQuery.isLoading) {
      return (
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-surface-border bg-surface-elevated">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Daily Rate</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <SkeletonRow cols={4} />
            <SkeletonRow cols={4} />
          </tbody>
        </table>
      );
    }
    if (equipment.length === 0) {
      return (
        <EmptyState
          icon={<IconUsers />}
          title="No equipment"
          description="Add equipment to manage site resources"
        />
      );
    }
    return (
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-elevated">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Daily Rate</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((e: any) => (
            <tr key={e.id} className="border-t border-surface-border">
              <td className="px-4 py-2 text-text-primary">{e.name}</td>
              <td className="px-4 py-2 text-text-secondary">{e.type}</td>
              <td className="px-4 py-2 text-text-primary">
                ₹{e.daily_cost?.toFixed(2) ?? "0.00"}
              </td>
              <td className="px-4 py-2 text-xs">
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-text-secondary">
                  {e.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Resources" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold text-text-primary">
            Resources
          </h1>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWorkerModalOpen(true)}
            >
              + Add Worker
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEquipmentModalOpen(true)}
            >
              + Add Equipment
            </Button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="mb-3 flex gap-2 border-b border-border-subtle pb-1 text-xs">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 ${
            tab === "workers"
              ? "bg-surface-card text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
          onClick={() => setTab("workers")}
        >
          Workers
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 ${
            tab === "equipment"
              ? "bg-surface-card text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary"
          }`}
          onClick={() => setTab("equipment")}
        >
          Equipment
        </button>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-card p-4 shadow-card">
        {tab === "workers" ? renderWorkers() : renderEquipment()}
      </div>

      {/* Worker modal */}
      {workerModalOpen && (
        <Modal
          isOpen={workerModalOpen}
          onClose={() => setWorkerModalOpen(false)}
          title="Add Worker"
          size="md"
        >
          <form onSubmit={handleSubmit(onWorkerSubmit)} className="space-y-3">
            <FormField
              label="Name"
              required
              error={errors.name?.message}
            >
              <Input {...register("name")} />
            </FormField>
            <FormField
              label="Trade"
              required
              error={errors.trade?.message}
            >
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("trade")}
              >
                <option value="Mason">Mason</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Carpenter">Carpenter</option>
                <option value="General Labour">General Labour</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
            <FormField
              label="Hourly Rate (₹)"
              required
              error={errors.hourly_rate?.message}
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                {...register("hourly_rate", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </FormField>
            <FormField
              label="Availability"
              required
              error={errors.availability?.message}
            >
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...register("availability")}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setWorkerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting || workerMutation.isPending}
                disabled={isSubmitting || workerMutation.isPending}
              >
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Equipment modal */}
      {equipmentModalOpen && (
        <Modal
          isOpen={equipmentModalOpen}
          onClose={() => setEquipmentModalOpen(false)}
          title="Add Equipment"
          size="md"
        >
          <form
            onSubmit={handleSubmitEq(onEquipmentSubmit)}
            className="space-y-3"
          >
            <FormField
              label="Name"
              required
              error={eqErrors.name?.message}
            >
              <Input {...registerEq("name")} />
            </FormField>
            <FormField
              label="Type"
              required
              error={eqErrors.type?.message}
            >
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...registerEq("type")}
              >
                <option value="Excavator">Excavator</option>
                <option value="Crane">Crane</option>
                <option value="Mixer">Mixer</option>
                <option value="Generator">Generator</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
            <FormField
              label="Daily Rate (₹)"
              required
              error={eqErrors.daily_cost?.message}
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                {...registerEq("daily_cost", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              label="Status"
              required
              error={eqErrors.status?.message}
            >
              <select
                className="h-10 w-full rounded-md border border-surface-border bg-surface-base px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                {...registerEq("status")}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setEquipmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={eqSubmitting || equipmentMutation.isPending}
                disabled={eqSubmitting || equipmentMutation.isPending}
              >
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

