import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarCheck, ClipboardList, Lock } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { StatusBadge } from "@/components/academic/status-badge";
import { AttendanceSheet, type AttendanceRow } from "@/components/assessment/attendance-sheet";
import { AttendanceSummary } from "@/components/assessment/attendance-summary";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPct } from "@/lib/assessment";
import { formatDate } from "@/lib/format";
import { classGroups, curricula, curriculumComponents, stageLabel } from "@/lib/mock/academic";
import {
  academicPeriods,
  assignmentStats,
  attendanceStatusOf,
  attendanceTotalsOf,
  getAssignment,
  getRule,
  isLessonRegistered,
  lessonsOfAssignment,
  rosterOfAssignment,
} from "@/lib/mock/assessment";
import { requireTeacher } from "@/lib/teacher-context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Frequência | Gestão Escolar" };

const weekday = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" });

export default async function AssignmentAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ aula?: string }>;
}) {
  const { teacherId } = await requireTeacher();
  const { assignmentId } = await params;
  const { aula } = await searchParams;

  const assignment = getAssignment(assignmentId);
  if (!assignment || assignment.teacherId !== teacherId) notFound();

  const component = curriculumComponents.find((c) => c.id === assignment.componentId);
  const cls = classGroups.find((c) => c.id === assignment.classGroupId);
  if (!component || !cls) notFound();
  const curriculum = curricula.find((c) => c.id === component.curriculumId);
  const rule = getRule(component.id);

  const roster = rosterOfAssignment(assignmentId);
  const lessons = lessonsOfAssignment(assignmentId).sort((a, b) => b.date.localeCompare(a.date));
  const selected = lessons.find((l) => l.id === aula) ?? lessons[0];
  const selectedPeriod = selected && academicPeriods.find((p) => p.id === selected.periodId);
  const stats = assignmentStats(assignmentId);
  const minPct = rule?.minAttendancePct ?? 0;

  const sheetRows: AttendanceRow[] = roster.map((r) => ({
    enrollmentId: r.enrollment.id,
    studentName: r.student.name,
    editable: r.editable,
    lockReason: r.lockReason,
    status: selected ? attendanceStatusOf(selected.id, r.enrollment.id) : undefined,
  }));

  return (
    <>
      <BackLink href="/professor/frequencia">Lançamento de frequência</BackLink>

      <PageHeader
        title={component.name}
        description={`Turma ${cls.name} · ${stageLabel(cls.stageId)}${curriculum ? ` · ${curriculum.code}` : ""}`}
      />

      {!rule && (
        <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Este componente não tem regra de avaliação. A frequência mínima não pôde ser aplicada.
        </div>
      )}

      <section aria-label="Resumo da frequência" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Aulas com chamada" value={`${stats.lessonsRegistered}/${stats.lessonsTotal}`} icon={ClipboardList} />
        <StatCard label="Frequência média" value={formatPct(stats.avgAttendance)} hint={rule ? `mínimo exigido: ${rule.minAttendancePct}%` : undefined} icon={CalendarCheck} />
        <StatCard
          label="Alunos abaixo do mínimo"
          value={stats.atRisk}
          hint={stats.atRisk > 0 ? "em risco por frequência" : "nenhum no momento"}
          icon={AlertTriangle}
          tone={stats.atRisk > 0 ? "danger" : "success"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por aluno</CardTitle>
          <CardDescription>
            Acumulado das aulas com chamada.
            {rule && ` Falta justificada ${rule.justifiedCountsAsPresent ? "conta como presença" : "conta como falta"} neste componente.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {roster.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Nenhum aluno nesta alocação" description="Ainda não há alunos com vínculo ativo na matriz deste componente." />
          ) : (
            <AttendanceSummary
              minPct={minPct}
              rows={roster.map((r) => ({
                enrollmentId: r.enrollment.id,
                studentName: r.student.name,
                editable: r.editable,
                lockReason: r.lockReason,
                totals: attendanceTotalsOf(assignmentId, r.enrollment.id),
              }))}
            />
          )}
        </CardContent>
      </Card>

      <div id="chamada" className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aulas</CardTitle>
            <CardDescription>{lessons.length} registradas para esta turma e componente.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ul className="max-h-[32rem] space-y-1 overflow-y-auto px-1" aria-label="Lista de aulas">
              {lessons.map((l) => {
                const period = academicPeriods.find((p) => p.id === l.periodId);
                const done = isLessonRegistered(l.id);
                const active = l.id === selected?.id;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/professor/frequencia/${assignmentId}?aula=${l.id}#chamada`}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                        active ? "border-[#1d3f38] bg-[#1d3f38]/5" : "border-transparent hover:bg-muted",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium tabular-nums">
                          {formatDate(l.date)} <span className="font-normal text-muted-foreground">{weekday(l.date)}</span>
                        </span>
                        <span className="block text-xs text-muted-foreground">{period?.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {period?.status === "CLOSED" && <Lock className="size-3.5 text-muted-foreground" aria-label="Período encerrado" />}
                        <StatusBadge tone={done ? "success" : "warning"}>{done ? "Feita" : "Pendente"}</StatusBadge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chamada da aula</CardTitle>
            <CardDescription>
              {selected ? `${formatDate(selected.date)} · ${selectedPeriod?.name} · ${selected.topic}` : "Selecione uma aula."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <EmptyState icon={ClipboardList} title="Nenhuma aula registrada" description="Quando houver aulas para esta turma e componente, elas aparecem aqui." />
            ) : sheetRows.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Nenhum aluno nesta alocação" description="Ainda não há alunos com vínculo ativo na matriz deste componente." />
            ) : (
              <AttendanceSheet key={selected.id} rows={sheetRows} locked={selectedPeriod?.status === "CLOSED"} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
