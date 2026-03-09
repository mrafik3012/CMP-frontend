/**
 * PWA: Offline banner + sync status. Shown when offline or when reports are pending sync.
 */
import { useEffect, useRef } from "react";
import { useOnline } from "../../hooks/useOnline";
import { useReportQueue } from "../../hooks/useReportQueue";

export function OfflineBanner() {
  const online = useOnline();
  const { pendingCount, processQueue, refreshCount } = useReportQueue();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current && pendingCount > 0) {
      wasOffline.current = false;
      processQueue().then(() => refreshCount());
    } else if (online) {
      wasOffline.current = false;
    }
  }, [online, pendingCount, processQueue, refreshCount]);

  if (online && pendingCount === 0) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex min-h-[48px] items-center justify-center gap-2 bg-status-warning/95 px-4 py-2 text-sm font-medium text-text-inverse shadow-md"
    >
      {!online ? (
        <span>You're offline. Report downloads will be queued and synced when you're back online.</span>
      ) : (
        <span>
          {pendingCount} report{pendingCount !== 1 ? "s" : ""} pending — syncing…
        </span>
      )}
    </div>
  );
}
