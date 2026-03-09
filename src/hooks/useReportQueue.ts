import { useCallback, useEffect, useState } from "react";
import { reportQueue, type QueuedReport, type ReportQueueType } from "../lib/reportQueue";
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getAuthHeaders(): HeadersInit {
  return { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" };
}

async function processOne(item: QueuedReport): Promise<{ success: boolean; blob?: Blob; filename?: string }> {
  const { type, payload } = item;
  const url = `${baseURL}`;
  const opts: RequestInit = { credentials: "include", headers: getAuthHeaders() };

  if (type === "daily_pdf") {
    const projectId = payload.projectId as number;
    const report_date = payload.report_date as string;
    const res = await fetch(
      `${url}/projects/${projectId}/reports/daily/pdf?report_date=${encodeURIComponent(report_date)}`,
      { ...opts, method: "GET" }
    );
    if (!res.ok) throw new Error(`Daily PDF ${res.status}`);
    const blob = await res.blob();
    return { success: true, blob, filename: `daily-report-${report_date}-${projectId}.pdf` };
  }

  if (type === "weekly_pdf") {
    const projectId = payload.projectId as number;
    const week_start = payload.week_start as string;
    const res = await fetch(
      `${url}/projects/${projectId}/reports/weekly/pdf?week_start=${encodeURIComponent(week_start)}`,
      { ...opts, method: "GET" }
    );
    if (!res.ok) throw new Error(`Weekly PDF ${res.status}`);
    const blob = await res.blob();
    return { success: true, blob, filename: `weekly-report-${week_start}-${projectId}.pdf` };
  }

  if (type === "monthly_pdf") {
    const projectId = payload.projectId as number;
    const year = payload.year as number;
    const month = payload.month as number;
    const res = await fetch(
      `${url}/projects/${projectId}/reports/monthly/pdf?year=${year}&month=${month}`,
      { ...opts, method: "GET" }
    );
    if (!res.ok) throw new Error(`Monthly PDF ${res.status}`);
    const blob = await res.blob();
    return { success: true, blob, filename: `monthly-report-${year}-${String(month).padStart(2, "0")}-${projectId}.pdf` };
  }

  if (type === "create_daily") {
    const projectId = payload.projectId as number;
    const body = payload.body as Record<string, unknown>;
    const res = await fetch(`${url}/projects/${projectId}/reports/daily`, {
      ...opts,
      method: "POST",
      body: JSON.stringify({ report_type: "daily", ...body }),
    });
    if (!res.ok) throw new Error(`Create daily ${res.status}`);
    return { success: true };
  }

  throw new Error(`Unknown type: ${type}`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function useReportQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshCount = useCallback(async () => {
    const n = await reportQueue.count();
    setPendingCount(n);
  }, []);

  const addToQueue = useCallback(
    async (type: ReportQueueType, payload: Record<string, unknown>): Promise<string> => {
      const id = await reportQueue.add({ type, payload });
      await refreshCount();
      return id;
    },
    [refreshCount]
  );

  const processQueue = useCallback(async (): Promise<{ processed: number; failed: number }> => {
    const pending = await reportQueue.getPending();
    if (pending.length === 0) return { processed: 0, failed: 0 };
    setIsProcessing(true);
    let processed = 0;
    let failed = 0;
    for (const item of pending) {
      try {
        await reportQueue.setStatus(item.id, "processing");
        const result = await processOne(item);
        await reportQueue.remove(item.id);
        processed++;
        if (result.blob && result.filename) triggerDownload(result.blob, result.filename);
      } catch (e) {
        await reportQueue.setStatus(item.id, "failed", e instanceof Error ? e.message : "Unknown error");
        failed++;
      }
    }
    await refreshCount();
    setIsProcessing(false);
    return { processed, failed };
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return { pendingCount, isProcessing, addToQueue, processQueue, refreshCount };
}
