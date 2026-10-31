"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Lock, TriangleAlert } from "lucide-react";

import { StatusBadge } from "@/components/academic/status-badge";
import { GradeMeter } from "@/components/assessment/grade-meter";
import { AttendanceValue, ResultBadge } from "@/components/assessment/result-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeOutcome, type AssessmentRule, type PeriodGrade } from "@/lib/assessment";
import { formatGrade } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface GradeGridPeriod {
  id: string;
  name: string;
  status: "OPEN" | "CLOSED";
}

export interface GradeGridRow {
  enrollmentId: string;
  studentName: string;
  registration: string;
  editable: boolean;
  lockReason?: string;
  /** Frequência do aluno no componente (só afeta o resultado final). */
  attendancePct: number | null;
  grades: Record<string, PeriodGrade>;
}

interface GradeGridProps {
  rule: AssessmentRule;
  periods: GradeGridPeriod[];
  rows: GradeGridRow[];
  readOnly?: boolean;
}

const keyOf = (enrollmentId: string, periodId: string) => `${enrollmentId}:${periodId}`;

function toText(g: PeriodGrade | undefined, numeric: boolean): string {
  if (numeric) return g?.numeric !== undefined ? String(g.numeric).replace(".", ",") : "";
  return g?.concept ?? "";
}

function parseNumeric(raw: string, max: number): { value?: number; error?: string } {
  const t = raw.trim();
  if (!t) return {};
  if (!/^\d+([.,]\d{1,2})?$/.test(t)) return { error: "Use um número, ex.: 7,5" };
  const n = Number(t.replace(",", "."));
  if (n > max) return { error: `Máximo ${formatGrade(max)}` };
  return { value: n };
}

export function GradeGrid({ rule, periods, rows, readOnly = false }: GradeGridProps) {
  const numeric = rule.evaluationType === "NUMERIC";

  const initial = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of rows) for (const p of periods) m[keyOf(r.enrollmentId, p.id)] = toText(r.grades[p.id], numeric);
    return m;
  }, [rows, periods, numeric]);

  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!numeric) return e;
    for (const [k, v] of Object.entries(values)) {
      const r = parseNumeric(v, rule.maxGrade);
      if (r.error) e[k] = r.error;
    }
    return e;
  }, [values, numeric, rule.maxGrade]);

  const dirtyCount = Object.keys(values).filter((k) => values[k] !== baseline[k]).length;

  function gradesFor(row: GradeGridRow): (PeriodGrade | undefined)[] {
    return periods.map((p) => {
      const raw = values[keyOf(row.enrollmentId, p.id)];
      if (!raw) return undefined;
      if (numeric) {
        const r = parseNumeric(raw, rule.maxGrade);
        return r.value !== undefined ? { numeric: r.value } : undefined;
      }
      return { concept: raw };
    });
  }

  function save() {
    if (Object.keys(errors).length > 0) {
      setMessage({ kind: "error", text: "Corrija os campos destacados antes de salvar." });
      return;
    }
    const count = dirtyCount;
    startTransition(async () => {
      // TODO: Server Action (Zod + Prisma). O banco valida a alocação do professor e o período aberto.
      await new Promise((r) => setTimeout(r, 600));
      setBaseline(values);
      setMessage({ kind: "ok", text: `${count} lançamento${count > 1 ? "s" : ""} salvo${count > 1 ? "s" : ""}. Simulação: os dados ainda são mockados.` });
    });
  }

  return (
    <div className="space-y-4">
      {!numeric && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda dos conceitos">
          {rule.concepts.map((c) => (
            <li key={c.value}>
              <span className="font-medium text-foreground">{c.short}</span> {c.label}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {dirtyCount > 0 ? `${dirtyCount} alteraç${dirtyCount > 1 ? "ões não salvas" : "ão não salva"}` : "Nenhuma alteração"}
          </p>
          <Button onClick={save} disabled={pending || dirtyCount === 0}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar {numeric ? "notas" : "conceitos"}
          </Button>
        </div>
      )}

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Aluno</TableHead>
              {periods.map((p) => (
                <TableHead key={p.id} className="text-center">
                  <span className="inline-flex items-center justify-center gap-1">
                    {p.name}
                    {(p.status === "CLOSED" || readOnly) && <Lock className="size-3" aria-label="Período encerrado" />}
                  </span>
                  {p.status === "OPEN" && <span className="block text-[11px] font-normal text-muted-foreground">em andamento</span>}
                </TableHead>
              ))}
              <TableHead className="text-center">Média</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Freq.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const outcome = computeOutcome(rule, gradesFor(row), periods.length, row.attendancePct);
              return (
                <TableRow key={row.enrollmentId} className={cn(!row.editable && "bg-muted/30")}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{row.studentName}</p>
                    <p className="text-xs text-muted-foreground">Nº {row.registration}</p>
                    {row.lockReason && (
                      <div className="mt-1">
                        <StatusBadge tone="neutral">{row.lockReason}</StatusBadge>
                      </div>
                    )}
                  </TableCell>

                  {periods.map((p) => {
                    const k = keyOf(row.enrollmentId, p.id);
                    const v = values[k] ?? "";
                    const disabled = readOnly || !row.editable || p.status === "CLOSED" || pending;
                    const err = errors[k];
                    const parsed = numeric ? parseNumeric(v, rule.maxGrade).value : undefined;
                    const tone =
                      parsed === undefined
                        ? ""
                        : parsed < rule.recoveryMinGrade
                          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950"
                          : parsed < rule.passingGrade
                            ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                            : "";
                    const label = `${row.studentName}, ${p.name}`;
                    return (
                      <TableCell key={p.id} className="text-center align-top">
                        {numeric ? (
                          <Input
                            value={v}
                            onChange={(e) => {
                              setMessage(null);
                              setValues((s) => ({ ...s, [k]: e.target.value }));
                            }}
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label={label}
                            aria-invalid={!!err}
                            disabled={disabled}
                            className={cn("mx-auto h-9 w-20 text-center tabular-nums", tone, v !== baseline[k] && "ring-1 ring-[#1d3f38]")}
                          />
                        ) : (
                          <select
                            value={v}
                            onChange={(e) => {
                              setMessage(null);
                              setValues((s) => ({ ...s, [k]: e.target.value }));
                            }}
                            aria-label={label}
                            disabled={disabled}
                            className={cn(
                              "mx-auto h-9 w-20 rounded-md border border-input bg-background px-2 text-center text-sm disabled:opacity-60",
                              v !== baseline[k] && "ring-1 ring-[#1d3f38]",
                            )}
                          >
                            <option value="">—</option>
                            {rule.concepts.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.short}
                              </option>
                            ))}
                          </select>
                        )}
                        {err && (
                          <p role="alert" className="mt-1 text-xs text-destructive">
                            {err}
                          </p>
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell className="min-w-24 text-center">
                    {numeric && outcome.average !== null ? (
                      <div className="space-y-1.5">
                        <p className="font-semibold tabular-nums">{formatGrade(outcome.average)}</p>
                        <GradeMeter value={outcome.average} max={rule.maxGrade} passing={rule.passingGrade} recovery={rule.recoveryMinGrade} />
                        <p className="text-[11px] text-muted-foreground">{outcome.isFinal ? "final" : "parcial"}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <ResultBadge status={outcome.status} failedByAttendance={outcome.failedByAttendance} />
                  </TableCell>

                  <TableCell className="hidden text-right lg:table-cell">
                    <AttendanceValue pct={row.attendancePct} min={rule.minAttendancePct} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
