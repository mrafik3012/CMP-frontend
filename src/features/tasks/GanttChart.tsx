/**
 * Custom CSS Gantt chart — no external library dependencies.
 */
import { useMemo } from "react";
import { format, differenceInDays, parseISO, startOfDay, isValid } from "date-fns";

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
}

interface Props {
  tasks: GanttTask[];
  viewMode?: "Day" | "Week" | "Month";
}

const STATUS_COLORS = [
  "bg-accent-secondary",
  "bg-status-success",
  "bg-status-warning",
  "bg-status-error",
  "bg-accent-secondary",
  "bg-status-success",
];

function safeParseISO(s: string): Date | null {
  try {
    const d = parseISO(s);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export function GanttChart({ tasks, viewMode = "Week" }: Props) {
  const today = startOfDay(new Date());

  // Filter to only valid tasks
  const validTasks = tasks.filter(t => safeParseISO(t.start) && safeParseISO(t.end));

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (validTasks.length === 0) {
      const min = new Date(today); min.setDate(today.getDate() - 3);
      const max = new Date(today); max.setDate(today.getDate() + 30);
      return { minDate: min, maxDate: max, totalDays: 33 };
    }
    const starts = validTasks.map(t => safeParseISO(t.start)!);
    const ends   = validTasks.map(t => safeParseISO(t.end)!);
    const min = new Date(Math.min(...starts.map(d => d.getTime())));
    const max = new Date(Math.max(...ends.map(d => d.getTime())));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 3);
    const total = differenceInDays(max, min) + 1;
    return { minDate: min, maxDate: max, totalDays: Math.max(total, 7) };
  }, [validTasks]);

  if (validTasks.length === 0) {
    return (
      <div className="py-12 text-center text-text-muted">
        <p className="mb-2 text-3xl">📅</p>
        <p className="text-sm">
          No tasks with valid start &amp; due dates
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Add start and due dates to tasks to see them here
        </p>
      </div>
    );
  }

  const step = viewMode === "Day" ? 1 : viewMode === "Week" ? 7 : 14;
  const dateHeaders: Date[] = [];
  for (let i = 0; i < totalDays; i += step) {
    const d = new Date(minDate);
    d.setDate(minDate.getDate() + i);
    dateHeaders.push(d);
  }

  const getLeftPct  = (date: string) => {
    const d = safeParseISO(date);
    if (!d) return 0;
    return Math.max(0, (differenceInDays(d, minDate) / totalDays) * 100);
  };

  const getWidthPct = (start: string, end: string) => {
    const s = safeParseISO(start);
    const e = safeParseISO(end);
    if (!s || !e) return 2;
    const days = differenceInDays(e, s) + 1;
    return Math.max((days / totalDays) * 100, 1.5);
  };

  const todayLeftPct = (differenceInDays(today, minDate) / totalDays) * 100;

  // Build month labels
  const months: { label: string; pct: number }[] = [];
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const visStart = cur < minDate ? minDate : new Date(cur);
    const visEnd   = monthEnd > maxDate ? maxDate : monthEnd;
    const days = differenceInDays(visEnd, visStart) + 1;
    months.push({ label: format(cur, "MMM yyyy"), pct: (days / totalDays) * 100 });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">

        {/* Month headers */}
        <div className="mb-1 flex pl-40">
          {months.map((m, i) => (
            <div key={i} style={{ width: `${m.pct}%` }}
              className="truncate border-l border-border-subtle py-1 pl-1 text-xs font-semibold text-text-secondary">
              {m.label}
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="relative mb-3 h-5 pl-40">
          {dateHeaders.map((d, i) => (
            <span key={i}
              className="absolute -translate-x-1/2 text-xs text-text-muted"
              style={{ left: `calc(160px + ${(differenceInDays(d, minDate) / totalDays) * 100}%)` }}>
              {format(d, viewMode === "Day" ? "dd" : "dd")}
            </span>
          ))}
        </div>

        {/* Task rows */}
        <div className="space-y-2">
          {validTasks.map((task, idx) => {
            const left  = getLeftPct(task.start);
            const width = getWidthPct(task.start, task.end);
            const color = STATUS_COLORS[idx % STATUS_COLORS.length];
            const endDate = safeParseISO(task.end);
            const isOverdue = endDate && endDate < today && task.progress < 100;

            return (
              <div key={task.id} className="flex items-center h-9">
                {/* Label */}
                <div className="w-40 flex-shrink-0 pr-3 text-right text-xs font-medium text-text-primary truncate">
                  {task.name}
                </div>

                {/* Timeline */}
                <div className="relative h-9 flex-1 overflow-hidden rounded border border-border-subtle bg-surface-hover/60">
                  {/* Today line */}
                  {todayLeftPct >= 0 && todayLeftPct <= 100 && (
                    <div className="absolute top-0 bottom-0 z-10 w-0.5 bg-status-error"
                      style={{ left: `${todayLeftPct}%` }} />
                  )}

                  {/* Bar */}
                  <div
                    className={`absolute top-1.5 flex h-6 cursor-default items-center overflow-hidden rounded ${isOverdue ? "bg-status-error" : color} px-2 shadow-sm`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${task.name} | ${task.start} → ${task.end} | ${task.progress}%`}
                  >
                    <div className="absolute inset-0 bg-black/25 rounded"
                      style={{ width: `${task.progress}%` }} />
                    <span className="relative z-10 text-white text-xs font-medium truncate whitespace-nowrap">
                      {task.name}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-10 flex-shrink-0 pl-2 text-right text-xs text-text-muted">
                  {task.progress}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-3 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-3 bg-status-error" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-status-error" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm border border-border-subtle bg-background-primary" />
            <span>Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
