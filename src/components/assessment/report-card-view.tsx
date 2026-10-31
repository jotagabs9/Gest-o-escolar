import { AlertTriangle, CalendarCheck, CheckCircle2, TrendingUp } from "lucide-react";

import { StatusBadge } from "@/components/academic/status-badge";
import { AttendanceValue, ResultBadge } from "@/components/assessment/result-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { LinkStatusBadge, RoleBadge } from "@/components/people/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EVALUATION_TYPE_LABEL, formatPct, type AssessmentRule, type PeriodGrade } from "@/lib/assessment";
import { formatGrade } from "@/lib/format";
import type { LinkStatus } from "@/lib/mock/people";
import type { ReportCard, ReportRow } from "@/lib/mock/report-card";
import { cn } from "@/lib/utils";

function GradeCell({ grade, rule }: { grade: PeriodGrade | undefined; rule: AssessmentRule | null }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  if (grade.numeric !== undefined) {
    const low = !!rule && grade.numeric < rule.passingGrade;
    return (
      <span className={cn("tabular-nums", low && "font-medium text-amber-700 dark:text-amber-400")}>
        {formatGrade(grade.numeric)}
      </span>
    );
  }
  const concept = rule?.concepts.find((c) => c.value === grade.concept);
  return (
    <span
      title={concept?.label}
      className="inline-flex min-w-8 justify-center rounded border px-1.5 py-0.5 text-xs font-medium"
    >
      {concept?.short ?? grade.concept}
    </span>
  );
}

function ruleHint(rule: AssessmentRule | null): string {
  if (!rule) return "Sem regra de avaliação cadastrada";
  if (rule.evaluationType === "NUMERIC") return `Média mínima ${formatGrade(rule.passingGrade)} · freq. mínima ${rule.minAttendancePct}%`;
  return `${EVALUATION_TYPE_LABEL[rule.evaluationType]} · freq. mínima ${rule.minAttendancePct}%`;
}

function Row({ row }: { row: ReportRow }) {
  const inactive = row.linkStatus === "DROPPED" || row.linkStatus === "TRANSFERRED";
  return (
    <TableRow className={cn(inactive && "bg-muted/30 text-muted-foreground")}>
      <TableCell className="pl-6">
        <p className="font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.teacherName ? `Prof. ${row.teacherName}` : "Sem professor alocado"} · {row.hours}h
        </p>
        <p className="text-xs text-muted-foreground">{ruleHint(row.rule)}</p>
        {inactive && (
          <div className="mt-1">
            <LinkStatusBadge status={row.linkStatus as LinkStatus} />
          </div>
        )}
      </TableCell>
      {row.grades.map((g, i) => (
        <TableCell key={i} className="text-center">
          <GradeCell grade={g} rule={row.rule} />
        </TableCell>
      ))}
      <TableCell className="text-center">
        {row.outcome.average !== null ? (
          <>
            <span className="font-semibold tabular-nums text-foreground">{formatGrade(row.outcome.average)}</span>
            <span className="block text-[11px] text-muted-foreground">{row.outcome.isFinal ? "final" : "parcial"}</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <AttendanceValue pct={row.attendance?.pct ?? null} min={row.rule?.minAttendancePct ?? null} />
        {row.attendance && (
          <span className="block text-[11px] text-muted-foreground">
            {row.attendance.absent + row.attendance.justified} falta{row.attendance.absent + row.attendance.justified === 1 ? "" : "s"}
          </span>
        )}
      </TableCell>
      <TableCell className="pr-6">
        <ResultBadge status={row.outcome.status} failedByAttendance={row.outcome.failedByAttendance} />
      </TableCell>
    </TableRow>
  );
}

export function ReportCardView({ card }: { card: ReportCard }) {
  const { summary, periods, sections } = card;
  const rows = sections.flatMap((s) => s.rows);
  const finals = summary.approved + summary.recovery + summary.failed;
  const anyAttendanceRisk = rows.some((r) => r.attendanceRisk);
  const distinctLinks = sections
    .flatMap((s) => s.links)
    .filter((l, i, arr) => arr.findIndex((x) => x.curriculumId === l.curriculumId) === i);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight">{card.student.name}</p>
            <p className="text-sm text-muted-foreground">
              Turma {card.classGroupName} · {card.yearName} · Matrícula {card.enrollment.number} · Nº {card.student.registrationNumber}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {distinctLinks.map((l) => (
              <span key={l.curriculumId} className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                <span className="font-medium">{l.code}</span>
                <RoleBadge role={l.role} />
                <LinkStatusBadge status={l.status as LinkStatus} />
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <section aria-label="Resumo do boletim" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Média geral"
          value={formatGrade(summary.overallAverage)}
          hint="das notas numéricas lançadas"
          icon={TrendingUp}
        />
        <StatCard
          label="Frequência geral"
          value={formatPct(summary.overallAttendance)}
          hint="aulas com chamada registrada"
          icon={CalendarCheck}
          tone={anyAttendanceRisk ? "warning" : "default"}
        />
        <StatCard
          label="Componentes com alerta"
          value={summary.alerts}
          hint={summary.alerts > 0 ? "nota ou frequência abaixo do mínimo" : "nenhum no momento"}
          icon={AlertTriangle}
          tone={summary.alerts > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Resultados finais"
          value={finals}
          hint={`${summary.approved} aprovado(s) · ${summary.recovery} em recuperação · ${summary.failed} reprovado(s)`}
          icon={CheckCircle2}
        />
      </section>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Esta matrícula ainda não tem matriz curricular vinculada, então não há componentes para exibir no boletim.
          </CardContent>
        </Card>
      ) : (
        sections.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{section.label}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {section.links.map((l) => (
                    <span key={l.curriculumId} className="inline-flex items-center gap-1.5">
                      {l.code} <LinkStatusBadge status={l.status as LinkStatus} />
                    </span>
                  ))}
                </div>
              </div>
              <CardDescription>
                {section.rows.length} componente{section.rows.length > 1 ? "s" : ""} ·{" "}
                {section.rows.reduce((s, r) => s + r.hours, 0)}h
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-56 pl-6">Componente</TableHead>
                    {periods.map((p) => (
                      <TableHead key={p.id} className="text-center">
                        {p.name}
                        {p.status === "OPEN" && <span className="block text-[11px] font-normal text-muted-foreground">em andamento</span>}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Média</TableHead>
                    <TableHead className="text-right">Freq.</TableHead>
                    <TableHead className="pr-6">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.rows.map((row) => (
                    <Row key={`${row.curriculumId}:${row.componentId}`} row={row} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      <div className="text-xs text-muted-foreground">
        As notas e frequências mínimas vêm da regra de avaliação de cada componente. Resultado final só depois de todos os
        períodos lançados. Para conceitos: PS plenamente satisfatório, S satisfatório, ED em desenvolvimento, NS não satisfatório.{" "}
        <StatusBadge tone="info" className="align-middle">
          parcial
        </StatusBadge>{" "}
        indica período ainda em andamento.
      </div>
    </div>
  );
}
