/**
 * Daily Site Report form per Report Templates Requirements 4.1.
 * Header, workforce, work items, materials, issues.
 */
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { Input } from "../../components/common/Input";
import type { DailyReportCreatePayload } from "../../api/client";

const TRADES = ["Masons", "Carpenters", "Electricians", "Helpers", "Subcontractors", "Other"];
const WEATHER_OPTIONS = ["Clear", "Cloudy", "Rain", "Snow", "Extreme Heat"];
const MATERIAL_STATUS = ["received", "pending", "delayed"];
const ISSUE_TYPES = ["Delay", "Material Shortage", "Weather", "Equipment", "Labor", "Quality"];
const IMPACT_OPTIONS = ["low", "medium", "high"];

const workforceRowSchema = z.object({
  trade: z.string().min(1, "Required"),
  present: z.coerce.number().min(0),
  absent: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
});

const workItemRowSchema = z.object({
  task_name: z.string().min(1, "Task required"),
  location: z.string().optional(),
  boq_item: z.string().optional(),
  progress_today: z.coerce.number().min(0).max(100),
  progress_cumulative: z.coerce.number().min(0).max(100),
});

const materialRowSchema = z.object({
  item_name: z.string().min(1, "Item required"),
  quantity: z.string().optional(),
  supplier: z.string().optional(),
  status: z.string().optional(),
});

const issueRowSchema = z.object({
  issue_type: z.string().optional(),
  description: z.string().min(1, "Description required"),
  impact: z.string().optional(),
  responsible_party: z.string().optional(),
});

const formSchema = z.object({
  report_date: z.string().min(1, "Date required"),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  notes: z.string().optional(),
  workforce: z.array(workforceRowSchema).default([{ trade: "", present: 0, absent: 0, total: 0 }]),
  work_items: z.array(workItemRowSchema).min(1, "At least one work item required"),
  materials: z.array(materialRowSchema).default([{ item_name: "", quantity: "", supplier: "", status: "" }]),
  issues: z.array(issueRowSchema).default([{ issue_type: "", description: "", impact: "", responsible_party: "" }]),
});

type FormData = z.infer<typeof formSchema>;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export interface DailyReportFormProps {
  projectId: number;
  initialData?: Partial<DailyReportCreatePayload> & { report_date?: string };
  onSubmit: (data: DailyReportCreatePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function DailyReportForm({
  projectId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DailyReportFormProps) {
  const defaultWorkItems = initialData?.work_items?.length
    ? initialData.work_items
    : [{ task_name: "", location: "", boq_item: "", progress_today: 0, progress_cumulative: 0 }];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      report_date: initialData?.report_date ?? todayISO(),
      weather: initialData?.weather ?? "Clear",
      temperature: initialData?.temperature?.toString() ?? "",
      shift_start: initialData?.shift_start ?? "08:00",
      shift_end: initialData?.shift_end ?? "18:00",
      notes: initialData?.notes ?? "",
      workforce: initialData?.workforce?.length
        ? initialData.workforce
        : [{ trade: "", present: 0, absent: 0, total: 0 }],
      work_items: defaultWorkItems,
      materials: initialData?.materials?.length
        ? initialData.materials
        : [{ item_name: "", quantity: "", supplier: "", status: "" }],
      issues: initialData?.issues?.length
        ? initialData.issues
        : [{ issue_type: "", description: "", impact: "", responsible_party: "" }],
    },
  });

  const { fields: wfFields, append: appendWf, remove: removeWf } = useFieldArray({ control, name: "workforce" });
  const { fields: wiFields, append: appendWi, remove: removeWi } = useFieldArray({ control, name: "work_items" });
  const { fields: matFields, append: appendMat, remove: removeMat } = useFieldArray({ control, name: "materials" });
  const { fields: issueFields, append: appendIssue, remove: removeIssue } = useFieldArray({ control, name: "issues" });

  const handleFormSubmit = (data: FormData) => {
    const payload: DailyReportCreatePayload = {
      report_type: "daily",
      report_date: data.report_date,
      weather: data.weather || null,
      temperature: data.temperature ? parseFloat(data.temperature) : null,
      shift_start: data.shift_start || null,
      shift_end: data.shift_end || null,
      notes: data.notes || null,
      workforce: data.workforce
        .filter((r) => r.trade.trim() !== "")
        .map((r) => ({
          trade: r.trade,
          present: Number(r.present),
          absent: Number(r.absent),
          total: Number(r.total),
        })),
      work_items: data.work_items
        .filter((r) => r.task_name.trim() !== "")
        .map((r) => ({
          task_name: r.task_name,
          location: r.location || undefined,
          boq_item: r.boq_item || undefined,
          progress_today: Number(r.progress_today),
          progress_cumulative: Number(r.progress_cumulative),
        })),
      materials: data.materials
        .filter((r) => r.item_name.trim() !== "")
        .map((r) => ({
          item_name: r.item_name,
          quantity: r.quantity || undefined,
          supplier: r.supplier || undefined,
          status: r.status || undefined,
        })),
      issues: data.issues
        .filter((r) => r.description.trim() !== "")
        .map((r) => ({
          issue_type: r.issue_type || undefined,
          description: r.description,
          impact: r.impact || undefined,
          responsible_party: r.responsible_party || undefined,
        })),
    };
    return onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Header */}
      <section className="rounded-lg border border-border-subtle bg-surface-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Report header</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Report date" required error={errors.report_date?.message}>
            <input
              type="date"
              className="input-base"
              {...register("report_date")}
            />
          </FormField>
          <FormField label="Weather" error={errors.weather?.message}>
            <select className="input-base" {...register("weather")}>
              {WEATHER_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Temperature (°C)" error={errors.temperature?.message}>
            <Input type="number" step="0.1" placeholder="e.g. 28" {...register("temperature")} />
          </FormField>
          <FormField label="Shift start" error={errors.shift_start?.message}>
            <Input type="time" {...register("shift_start")} />
          </FormField>
          <FormField label="Shift end" error={errors.shift_end?.message}>
            <Input type="time" {...register("shift_end")} />
          </FormField>
        </div>
        <div className="mt-3">
          <FormField label="Notes" error={errors.notes?.message}>
            <textarea
            className="input-base min-h-[80px] w-full resize-y"
            placeholder="General notes..."
            {...register("notes")}
          />
          </FormField>
        </div>
      </section>

      {/* Workforce */}
      <section className="rounded-lg border border-border-subtle bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Workforce</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => appendWf({ trade: "", present: 0, absent: 0, total: 0 })}>
            + Add trade
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Trade</th>
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Present</th>
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Absent</th>
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {wfFields.map((field, i) => (
                <tr key={field.id} className="border-b border-surface-border/60">
                  <td className="px-2 py-1.5">
                    <select className="input-base w-full min-w-[120px]" {...register(`workforce.${i}.trade`)}>
                      <option value="">Select...</option>
                      {TRADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" min={0} className="w-20" {...register(`workforce.${i}.present`)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" min={0} className="w-20" {...register(`workforce.${i}.absent`)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" min={0} className="w-20" {...register(`workforce.${i}.total`)} />
                  </td>
                  <td className="px-2 py-1.5">
                    {wfFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeWf(i)}>Remove</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Work done today */}
      <section className="rounded-lg border border-border-subtle bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Work done today</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => appendWi({ task_name: "", location: "", boq_item: "", progress_today: 0, progress_cumulative: 0 })}>
            + Add item
          </Button>
        </div>
        {errors.work_items?.message && (
          <p className="mb-2 text-xs text-status-danger">{errors.work_items.message}</p>
        )}
        <div className="space-y-2">
          {wiFields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap items-end gap-2 rounded border border-border-subtle p-2">
              <input
                className="input-base flex-1 min-w-[140px]"
                placeholder="Task name"
                {...register(`work_items.${i}.task_name`)}
              />
              <input
                className="input-base w-28"
                placeholder="Location"
                {...register(`work_items.${i}.location`)}
              />
              <input
                className="input-base w-24"
                placeholder="BOQ"
                {...register(`work_items.${i}.boq_item`)}
              />
              <input
                type="number"
                min={0}
                max={100}
                className="input-base w-20"
                placeholder="Today %"
                {...register(`work_items.${i}.progress_today`)}
              />
              <input
                type="number"
                min={0}
                max={100}
                className="input-base w-24"
                placeholder="Cum. %"
                {...register(`work_items.${i}.progress_cumulative`)}
              />
              {wiFields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeWi(i)}>Remove</Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Materials */}
      <section className="rounded-lg border border-border-subtle bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Materials delivered</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => appendMat({ item_name: "", quantity: "", supplier: "", status: "" })}>
            + Add
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Item</th>
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Quantity</th>
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Supplier</th>
                <th className="px-2 py-1.5 text-left font-medium text-text-secondary">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {matFields.map((field, i) => (
                <tr key={field.id} className="border-b border-surface-border/60">
                  <td className="px-2 py-1.5">
                    <Input className="w-full min-w-[140px]" placeholder="Item name" {...register(`materials.${i}.item_name`)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input className="w-28" placeholder="e.g. 50 bags" {...register(`materials.${i}.quantity`)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input className="w-32" placeholder="Supplier" {...register(`materials.${i}.supplier`)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select className="input-base w-28" {...register(`materials.${i}.status`)}>
                      <option value="">—</option>
                      {MATERIAL_STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    {matFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMat(i)}>Remove</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Issues */}
      <section className="rounded-lg border border-border-subtle bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Issues / delays</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => appendIssue({ issue_type: "", description: "", impact: "", responsible_party: "" })}>
            + Add
          </Button>
        </div>
        <div className="space-y-2">
          {issueFields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap gap-2 rounded border border-border-subtle p-2">
              <select className="input-base w-36" {...register(`issues.${i}.issue_type`)}>
                <option value="">Type</option>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                className="input-base flex-1 min-w-[180px]"
                placeholder="Description"
                {...register(`issues.${i}.description`)}
              />
              <select className="input-base w-24" {...register(`issues.${i}.impact`)}>
                <option value="">Impact</option>
                {IMPACT_OPTIONS.map((imp) => (
                  <option key={imp} value={imp}>{imp}</option>
                ))}
              </select>
              <Input className="w-32" placeholder="Responsible" {...register(`issues.${i}.responsible_party`)} />
              {issueFields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeIssue(i)}>Remove</Button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save report</Button>
      </div>
    </form>
  );
}
