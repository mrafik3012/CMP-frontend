import { useAuthStore } from "../../stores/authStore";

export function TrialBanner() {
  const user = useAuthStore((s) => s.user) as any;
  if (!user || user.plan !== "trial" || !user.trial_expires_at) return null;

  const expiresAt = new Date(user.trial_expires_at);
  const today = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 14) return null;

  if (daysLeft <= 0) return (
    <div className="bg-status-danger px-4 py-2 text-center text-sm font-medium text-white">
      Your 3-month trial has expired. Please upgrade to continue using BuildDesk.
    </div>
  );

  return (
    <div className="bg-status-warning/20 border-b border-status-warning/30 px-4 py-2 text-center text-sm text-status-warning">
      ⏳ Your 3-month free trial expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.{" "}
      <a href="mailto:support@builddesk.in" className="underline font-medium">Upgrade now</a>
    </div>
  );
}
