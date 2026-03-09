// MODIFIED: 2026-03-03 - Added project documents page with upload and list

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageTitle } from "../../components/common/PageTitle";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonRow } from "../../components/common/Skeleton";
import { IconDownload } from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { documentsApi } from "../../api/client";
import { formatDate, formatCurrency } from "../../utils/format";
import { useAuthStore } from "../../stores/authStore";

interface DocumentRow {
  id: number;
  project_id: number | null;
  original_filename: string;
  file_path: string;
  file_size_kb: number;
  version: number;
  tag?: string | null;
  uploaded_by: number;
  upload_date: string;
}

const TAGS = [
  "Contract",
  "Blueprint",
  "RFI",
  "Inspection Report",
  "Change Order",
  "Invoice",
  "Other",
] as const;

export function DocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const canUpload =
    role === "Admin" ||
    role === "Project Manager" ||
    role === "Site Engineer";

  const [tagFilter, setTagFilter] = useState<string>("All");
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState<string>("Other");

  const {
    data,
    isLoading,
    isError,
  } = useQuery<DocumentRow[]>({
    queryKey: ["documents", pid],
    enabled: Number.isFinite(pid),
    queryFn: () =>
      documentsApi.listByProject(pid).then((r) => r.data as DocumentRow[]),
  });

  if (isError) {
    toastError("Failed to load documents");
  }

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file");
      const form = new FormData();
      form.append("file", file);
      form.append("tag", tag);
      return documentsApi.uploadToProject(pid, form);
    },
    onSuccess: () => {
      toastSuccess("File uploaded");
      queryClient.invalidateQueries({ queryKey: ["documents", pid] });
      setFile(null);
      setTag("Other");
    },
    onError: () => {
      toastError("Upload failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      toastSuccess("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents", pid] });
    },
    onError: () => {
      toastError("Failed to delete document");
    },
  });

  const handleDownload = async (id: number, name: string) => {
    try {
      const res = await documentsApi.download(id);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toastError("Failed to download file");
    }
  };

  const filtered =
    data?.filter((d) =>
      tagFilter === "All" ? true : (d.tag ?? "Other") === tagFilter,
    ) ?? [];

  if (!Number.isFinite(pid)) {
    return (
      <div className="p-6 text-status-danger">
        Invalid project ID for documents.
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <PageTitle title="Documents" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Documents</h1>
        {canUpload && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-xs text-text-secondary file:mr-2 file:rounded-md file:border file:border-surface-border file:bg-surface-elevated file:px-2 file:py-1 file:text-xs file:text-text-primary"
            />
            <select
              className="h-9 rounded-md border border-surface-border bg-surface-base px-2 text-xs text-text-primary"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
            >
              Upload File
            </Button>
          </div>
        )}
      </header>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
        {["All", ...TAGS].map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-full px-3 py-1 ${
              tagFilter === t
                ? "bg-surface-card text-text-primary shadow-sm"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary"
            }`}
            onClick={() => setTagFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-subtle bg-background-primary/80">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Tag</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">Version</th>
              <th className="px-4 py-2">Uploaded By</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow cols={7} />
                <SkeletonRow cols={7} />
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  <EmptyState
                    icon={<IconDownload />}
                    title="No documents"
                    description="Upload project documents to share with your team"
                  />
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-t border-border-subtle hover:bg-surface-hover/60">
                  <td className="px-4 py-2 text-text-primary">
                    {d.original_filename}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    {d.tag ?? "Other"}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    {d.file_size_kb.toFixed(1)} KB
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    v{d.version}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    User #{d.uploaded_by}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    {formatDate(d.upload_date)}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-text-primary"
                        onClick={() =>
                          handleDownload(d.id, d.original_filename)
                        }
                      >
                        <IconDownload className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                      {canUpload && (
                        <button
                          type="button"
                          className="text-status-error hover:text-status-error/80"
                          onClick={() => deleteMutation.mutate(d.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

