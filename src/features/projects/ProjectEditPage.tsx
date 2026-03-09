import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { projectsApi } from "../../api/client";
import { useToast } from "../../components/common/Toast";

interface ProjectForm {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  sqft: number;
  project_type: string;
  project_category: string;
}

export function ProjectEditPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(Number(projectId)).then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectForm>();

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        start_date: project.start_date?.slice(0, 10) ?? "",
        end_date: project.end_date?.slice(0, 10) ?? "",
        estimated_budget: project.estimated_budget ?? 0,
        sqft: project.sqft ?? 0,
        project_type: project.project_type,
        project_category: project.project_category,
      });
    }
  }, [project, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProjectForm) =>
      projectsApi
        .update(Number(projectId), {
          name: data.name,
          description: data.description,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date,
          estimated_budget: data.estimated_budget,
          sqft: data.sqft,
          project_type: data.project_type,
          project_category: data.project_category,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toastSuccess("Project updated successfully");
      navigate(`/projects/${projectId}`);
    },
    onError: () => toastError("Failed to update project"),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name *</label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select
              {...register("status", { required: "Status is required" })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              {...register("start_date", { required: "Start date is required" })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date *</label>
            <input
              type="date"
              {...register("end_date", { required: "End date is required" })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Budget (₹) *</label>
            <input
              type="number"
              {...register("estimated_budget", { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SqFt *</label>
            <input
              type="number"
              {...register("sqft", { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              {...register("project_type")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              {...register("project_category")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Construction">Construction</option>
              <option value="Interior">Interior</option>
              <option value="Renovation">Renovation</option>
              <option value="Smart Automation">Smart Automation</option>
              <option value="Roofing">Roofing</option>
              <option value="PEB">PEB</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="border px-6 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}