import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logsApi } from "../../api/client";
import { useToast } from "./Toast";

interface Props {
  projectId: number;
  date: string;
}

export function LogPhotoPanel({ projectId, date }: Props) {
  const qc = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: photos = [] } = useQuery({
    queryKey: ["log-photos", projectId, date],
    queryFn: () => logsApi.getPhotos(projectId, date).then((r) => r.data as any[]),
    enabled: !!date,
  });

  const uploadMutation = useMutation({
    mutationFn: () => logsApi.uploadPhoto(projectId, date, selectedFile!, caption),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["log-photos", projectId, date] });
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
      toastSuccess("Photo uploaded");
    },
    onError: () => toastError("Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: number) => logsApi.deletePhoto(projectId, date, photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["log-photos", projectId, date] });
      toastSuccess("Photo deleted");
    },
    onError: () => toastError("Delete failed"),
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toastError("File must be under 10MB");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">Progress Photos</h3>

      {/* Upload area */}
      <div className="rounded-lg border border-dashed border-border-default p-4">
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt="preview" className="h-40 w-full rounded-lg object-cover" />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-base px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                className="flex-1 rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => { setPreview(null); setSelectedFile(null); }}
                className="rounded-lg border border-border-default px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-1 text-text-secondary hover:text-text-primary"
          >
            <span className="text-2xl">📷</span>
            <span className="text-sm">Click to add photo</span>
            <span className="text-xs text-text-muted">JPG, PNG, WEBP · Max 10MB</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onFileChange} />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((p: any) => (
            <div key={p.id} className="group relative rounded-lg overflow-hidden border border-border-default">
              <img
                src={`http://localhost:8000${p.file_path}`}
                alt={p.caption || "log photo"}
                className="h-28 w-full object-cover"
              />
              {p.caption && (
                <p className="truncate bg-surface-card px-2 py-1 text-xs text-text-secondary">{p.caption}</p>
              )}
              <button
                onClick={() => deleteMutation.mutate(p.id)}
                className="absolute right-1 top-1 hidden rounded bg-status-danger/90 px-1.5 py-0.5 text-xs text-white group-hover:block"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
