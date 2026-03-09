import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { PageTitle } from "../../components/common/PageTitle";
import { useToast } from "../../components/common/Toast";
import { usersApi } from "../../api/client";

export function EditProfilePage() {
  const user = useAuthStore((s) => s.user) as any;
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    try {
      const updated = await usersApi.update(user.id, { name, phone });
      setUser(updated.data);
      toastSuccess("Profile updated successfully");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Failed to update profile";
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle title="Edit Profile" />
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-text-primary">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-surface-card p-6 shadow-sm border border-border-default">

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
