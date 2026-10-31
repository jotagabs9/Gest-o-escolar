"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Lock, TriangleAlert } from "lucide-react";

import { StatusBadge } from "@/components/academic/status-badge";
import { Button } from "@/components/ui/button";
import { ATTENDANCE_LABEL, type AttendanceStatus } from "@/lib/assessment";
import { cn } from "@/lib/utils";

export interface AttendanceRow {
  enrollmentId: string;
  studentName: string;
  editable: boolean;
  lockReason?: string;
  status?: AttendanceStatus;
}

interface AttendanceSheetProps {
  rows: AttendanceRow[];
  /** Aula de período encerrado: somente leitura. */
  locked: boolean;
}

const OPTIONS: { value: AttendanceStatus; short: string; on: string }[] = [
  { value: "PRESENT", short: "P", on: "border-emerald-600 bg-emerald-600 text-white" },
  { value: "ABSENT", short: "F", on: "border-red-600 bg-red-600 text-white" },
  { value: "JUSTIFIED", short: "J", on: "border-sky-600 bg-sky-600 text-white" },
  { value: "LATE", short: "A", on: "border-amber-500 bg-amber-500 text-white" },
];

export function AttendanceSheet({ rows, locked }: AttendanceSheetProps) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | undefined>>(() =>
    Object.fromEntries(rows.map((r) => [r.enrollmentId, r.status])),
  );
  const [baseline, setBaseline] = useState(statuses);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const editable = rows.filter((r) => r.editable);
  const missing = editable.filter((r) => !statuses[r.enrollmentId]);
  const dirty = editable.filter((r) => statuses[r.enrollmentId] !== baseline[r.enrollmentId]).length;
  const count = (s: AttendanceStatus) => editable.filter((r) => statuses[r.enrollmentId] === s).length;

  function set(id: string, status: AttendanceStatus) {
    setMessage(null);
    setStatuses((s) => ({ ...s, [id]: status }));
  }

  function markAllPresent() {
    setMessage(null);
    setStatuses((s) => ({ ...s, ...Object.fromEntries(editable.map((r) => [r.enrollmentId, "PRESENT" as AttendanceStatus])) }));
  }

  function save() {
    if (missing.length > 0) {
      setMessage({ kind: "error", text: `Marque a situação de todos os alunos (${missing.length} sem marcação).` });
      return;
    }
    startTransition(async () => {
      // TODO: Server Action. O banco valida a alocação do professor e o período aberto.
      await new Promise((r) => setTimeout(r, 600));
      setBaseline(statuses);
      setMessage({ kind: "ok", text: "Chamada salva. Simulação: os dados ainda são mockados." });
    });
  }

  return (
    <div className="space-y-4">
      {locked && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>Esta aula é de um período encerrado. A chamada está em modo leitura.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {count("PRESENT")} presentes · {count("ABSENT")} faltas · {count("JUSTIFIED")} justificadas · {count("LATE")} atrasos
        </p>
        {!locked && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={markAllPresent} disabled={pending}>
              Todos presentes
            </Button>
            <Button type="button" onClick={save} disabled={pending || dirty === 0}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar chamada
            </Button>
          </div>
        )}
      </div>

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {message.kind === "ok" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
          <p>{message.text}</p>
        </div>
      )}

      <ul className="divide-y rounded-md border">
        {rows.map((r) => (
          <li key={r.enrollmentId} className={cn("flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between", !r.editable && "bg-muted/30")}>
            <div className="min-w-0">
              <p className="truncate font-medium">{r.studentName}</p>
              {r.lockReason && <StatusBadge tone="neutral">{r.lockReason}</StatusBadge>}
            </div>
            <div role="radiogroup" aria-label={`Situação de ${r.studentName}`} className="flex gap-1.5">
              {OPTIONS.map((o) => {
                const selected = statuses[r.enrollmentId] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${ATTENDANCE_LABEL[o.value]}: ${r.studentName}`}
                    disabled={locked || !r.editable || pending}
                    onClick={() => set(r.enrollmentId, o.value)}
                    className={cn(
                      "flex h-9 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60",
                      selected ? o.on : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="sm:hidden">{o.short}</span>
                    <span className="hidden sm:inline">{ATTENDANCE_LABEL[o.value]}</span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground sm:hidden">P presente · F falta · J justificada · A atraso</p>
    </div>
  );
}
