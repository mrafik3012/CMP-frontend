/**
 * Project creation form. FR-PROJ-001.
 */
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../../api/client";
import { Button } from "../../components/common/Button";

const projectTypeOptions = ["Residential", "Commercial", "Industrial", "Infrastructure"] as const;
const projectCategoryOptions = [
  "Construction",
  "Interior",
  "Renovation",
  "Smart Automation",
  "Roofing",
  "PEB",
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  client_name: z.string().min(1, "Client is required"),
  location: z.string().min(1, "Location is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  estimated_budget: z.number().min(0, "Budget must be ≥ 0"),
  sqft: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const num = Number(trimmed.replace(/,/g, ""));
        return Number.isNaN(num) ? NaN : num;
      }
      if (typeof value === "number") {
        return Number.isNaN(value) ? NaN : value;
      }
      return value;
    },
    z
      .number({ invalid_type_error: "Enter valid SqFt" })
      .min(1, "SqFt required")
      .max(999999, "SqFt must be \u2264 999,999"),
  ),
  project_type: z.enum(projectTypeOptions, { required_error: "Project type is required" }),
  project_category: z.enum(projectCategoryOptions, { required_error: "Project category is required" }),
  status: z.enum(["Planning", "Active", "On Hold", "Completed", "Cancelled"]),
  description: z.string().max(5000).optional(),
});

type FormData = z.infer<typeof schema>;

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "Planning",
      estimated_budget: 0,
      project_type: "Residential",
      project_category: "Construction",
    },
  });

  const create = useMutation({
    mutationFn: (data: FormData) => projectsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  const fieldStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    border: "1px solid #ddd",
    padding: 8,
    borderRadius: 4,
  };

  const errorTextStyle: React.CSSProperties = {
    color: "red",
    fontSize: 12,
  };

  return (
    <div style={{ maxWidth: 920, margin: "2rem auto", padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>New project</h1>
      <form
        onSubmit={handleSubmit((d) =>
          create.mutate({
            ...d,
            estimated_budget: Number(d.estimated_budget),
          }),
        )}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {/* Row 1: Name / Client */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Name *</label>
            <input {...register("name")} style={fieldStyle} />
            {errors.name && <div style={errorTextStyle}>{errors.name.message}</div>}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Client *</label>
            <input {...register("client_name")} style={fieldStyle} />
            {errors.client_name && <div style={errorTextStyle}>{errors.client_name.message}</div>}
          </div>

          {/* Row 2: Location full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Location *</label>
            <input {...register("location")} style={fieldStyle} />
            {errors.location && <div style={errorTextStyle}>{errors.location.message}</div>}
          </div>

          {/* Row 3: Dates */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Start *</label>
            <input {...register("start_date")} type="date" style={fieldStyle} />
            {errors.start_date && <div style={errorTextStyle}>{errors.start_date.message}</div>}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>End *</label>
            <input {...register("end_date")} type="date" style={fieldStyle} />
            {errors.end_date && <div style={errorTextStyle}>{errors.end_date.message}</div>}
          </div>

          {/* Row 4: Budget / SqFt / Type */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Budget *</label>
            <input
              {...register("estimated_budget", { valueAsNumber: true })}
              type="number"
              step="0.01"
              style={fieldStyle}
            />
            {errors.estimated_budget && <div style={errorTextStyle}>{errors.estimated_budget.message}</div>}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>SqFt *</label>
            <input
              {...register("sqft")}
              type="number"
              step="1"
              min={1}
              max={999999}
              style={fieldStyle}
            />
            {errors.sqft && <div style={errorTextStyle}>{errors.sqft.message}</div>}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Type *</label>
            <select {...register("project_type")} style={fieldStyle}>
              <option value="">Select type</option>
              {projectTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.project_type && <div style={errorTextStyle}>{errors.project_type.message}</div>}
          </div>

          {/* Row 5: Category / Status */}
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Category *</label>
            <select {...register("project_category")} style={fieldStyle}>
              <option value="">Select category</option>
              {projectCategoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.project_category && <div style={errorTextStyle}>{errors.project_category.message}</div>}
          </div>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Status *</label>
            <select {...register("status")} style={fieldStyle}>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            {errors.status && <div style={errorTextStyle}>{errors.status.message}</div>}
          </div>

          {/* Row 6: Description full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Description</label>
            <textarea {...register("description")} rows={4} style={fieldStyle} />
            {errors.description && <div style={errorTextStyle}>{errors.description.message}</div>}
          </div>
        </div>

        {/* Global/server error */}
        {create.isError && (
          <p style={{ color: "red", marginTop: 12 }}>
            Failed to create project. Please check the fields and try again.
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/projects")}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={create.isPending}
            isLoading={create.isPending}
          >
            {create.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
