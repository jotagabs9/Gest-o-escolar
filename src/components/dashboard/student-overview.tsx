"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck, GraduationCap, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  average,
  componentStatus,
  type GradingRules,
} from "@/lib/academic";
import { formatGrade, formatPercent } from "@/lib/format";
import type { StudentRecord } from "@/lib/mock/aluno";
import { cn } from "@/lib/utils";

interface StudentOverviewProps {
  students: StudentRecord[];
  rules: GradingRules;
  currentTerm: string;
}

export function StudentOverview({ students, rules, currentTerm }: StudentOverviewProps) {
  const [selectedId, setSelectedId] = useState(students[0]?.id);
  const student = students.find((s) => s.id === selectedId) ?? students[0];

  const rows = useMemo(
    () =>
      student.components.map((c) => {
        const avg = average(c.grades);
        return { ...c, avg, status: componentStatus(avg, c.attendancePct, rules) };
      }),
    [student, rules],
  );

  const avgs = rows.map((r) => r.avg).filter((v): v is number => v !== null);
  const overallAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null;
  const overallAttendance = rows.length
    ? rows.reduce((s, r) => s + r.attendancePct, 0) / rows.length
    : 0;
  const flagged = rows.filter((r) => r.status !== "OK").length;
  const termCount = Math.max(...rows.map((r) => r.grades.length), 0);

  return (
    <div className="space-y-6">
      {students.length > 1 && (
        <div role="group" aria-label="Escolher aluno" className="flex flex-wrap gap-2">
          {students.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === student.id}
              onClick={() => setSelectedId(s.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                s.id === student.id
                  ? "border-[#1d3f38] bg-[#1d3f38] text-[#f2efe6]"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{student.name}</h2>
        <p className="text-sm text-muted-foreground">
          Turma {student.classGroup} · {student.curricula.join(" + ")}
        </p>
      </div>

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Média geral"
          value={formatGrade(overallAvg)}
          hint={`mínimo para aprovação: ${formatGrade(rules.passingGrade)}`}
          icon={TrendingUp}
          tone={overallAvg !== null && overallAvg < rules.passingGrade ? "warning" : "success"}
        />
        <StatCard
          label="Frequência geral"
          value={formatPercent(overallAttendance)}
          hint={`mínimo exigido: ${rules.minAttendancePct}%`}
          icon={CalendarCheck}
          tone={overallAttendance < rules.minAttendancePct ? "danger" : "success"}
        />
        <StatCard
          label="Componentes com alerta"
          value={flagged}
          hint={flagged ? "nota ou frequência abaixo do mínimo" : "nenhum no momento"}
          icon={AlertTriangle}
          tone={flagged ? "warning" : "success"}
        />
        <StatCard label="Período atual" value={currentTerm} hint={`${rows.length} componentes`} icon={GraduationCap} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por componente</CardTitle>
          <CardDescription>Notas lançadas até agora e frequência acumulada.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={r.id}
                className="grid gap-3 px-6 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-6"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.curriculum} · Prof(a). {r.teacher}
                  </p>
                </div>

                <div className="flex gap-1.5" aria-label={`Notas por bimestre de ${r.name}`}>
                  {Array.from({ length: termCount }).map((_, i) => {
                    const g = r.grades[i] ?? null;
                    return (
                      <span
                        key={i}
                        title={`${i + 1}º bimestre`}
                        className={cn(
                          "flex h-8 w-11 items-center justify-center rounded-md border text-xs tabular-nums",
                          g === null
                            ? "border-dashed text-muted-foreground"
                            : g < rules.passingGrade
                              ? "border-amber-200 bg-amber-50 font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                              : "bg-muted font-medium",
                        )}
                      >
                        {formatGrade(g)}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 text-sm tabular-nums md:justify-end">
                  <span title="Média parcial">
                    <span className="text-xs text-muted-foreground">Média </span>
                    <span className="font-semibold">{formatGrade(r.avg)}</span>
                  </span>
                  <span title="Frequência">
                    <span className="text-xs text-muted-foreground">Freq. </span>
                    <span className="font-semibold">{formatPercent(r.attendancePct)}</span>
                  </span>
                </div>

                <div className="md:text-right">
                  <Badge variant="outline" className={STATUS_CLASS[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
