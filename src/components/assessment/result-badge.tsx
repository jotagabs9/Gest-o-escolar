import { AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/academic/status-badge";
import { RESULT_LABEL, RESULT_TONE, formatPct, type ResultStatus } from "@/lib/assessment";
import { cn } from "@/lib/utils";

export function ResultBadge({ status, failedByAttendance }: { status: ResultStatus; failedByAttendance?: boolean }) {
  const label = status === "FAILED" && failedByAttendance ? "Reprovado por frequência" : RESULT_LABEL[status];
  return <StatusBadge tone={RESULT_TONE[status]}>{label}</StatusBadge>;
}

/** Frequência em %, destacada quando abaixo do mínimo definido pela regra do componente. */
export function AttendanceValue({ pct, min }: { pct: number | null; min: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  const low = min !== null && pct < min;
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", low && "font-medium text-red-700 dark:text-red-400")}>
      {low && <AlertTriangle className="size-3.5" aria-hidden="true" />}
      {formatPct(pct)}
      {low && <span className="sr-only"> (abaixo do mínimo de {min}%)</span>}
    </span>
  );
}
