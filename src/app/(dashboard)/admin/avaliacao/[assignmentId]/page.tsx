import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpenCheck, FileWarning } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { AttendanceSummary } from "@/components/assessment/attendance-summary";
import { GradeGrid, type GradeGridRow } from "@/components/assessment/grade-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { classGroups, curriculumComponents, stageLabel } from "@/lib/mock/academic";
import {
  attendanceTotalsOf,
  getAssignment,
  getRule,
  gradesOf,
  periodsOfYear,
  rosterOfAssignment,
} from "@/lib/mock/assessment";
import { teacherProfiles } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Notas e frequência | Gestão Escolar" };

export default async function AdminAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { assignmentId } = await params;

  const assignment = getAssignment(assignmentId);
  const component = assignment && curriculumComponents.find((c) => c.id === assignment.componentId);
  const cls = assignment && classGroups.find((c) => c.id === assignment.classGroupId);
  if (!assignment || !component || !cls) notFound();

  const teacher = teacherProfiles.find((t) => t.id === assignment.teacherId);
  const rule = getRule(component.id);
  const periods = periodsOfYear(cls.academicYearId);
  const roster = rosterOfAssignment(assignmentId);

  const rows: GradeGridRow[] = roster.map((r) => {
    const grades = gradesOf(r.enrollment.id, component.id, periods);
    return {
      enrollmentId: r.enrollment.id,
      studentName: r.student.name,
      registration: r.student.registrationNumber,
      editable: r.editable,
      lockReason: r.lockReason,
      attendancePct: attendanceTotalsOf(assignmentId, r.enrollment.id)?.pct ?? null,
      grades: Object.fromEntries(periods.map((p, i) => [p.id, grades[i] ?? {}])),
    };
  });

  return (
    <>
      <BackLink href="/admin/avaliacao">Notas e frequência</BackLink>
      <PageHeader
        title={component.name}
        description={`Turma ${cls.name} · ${stageLabel(cls.stageId)} · Professor(a) ${teacher?.name ?? "—"} · somente leitura`}
      />

      {!rule ? (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={FileWarning}
              title="Componente sem regra de avaliação"
              description="Configure a regra de avaliação do componente para o professor poder lançar notas."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas</CardTitle>
              <CardDescription>Exatamente o que o professor lançou, por aluno e período.</CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <EmptyState icon={BookOpenCheck} title="Nenhum aluno nesta alocação" description="Ainda não há alunos com vínculo na matriz deste componente." />
              ) : (
                <GradeGrid rule={rule} periods={periods.map((p) => ({ id: p.id, name: p.name, status: p.status }))} rows={rows} readOnly />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frequência por aluno</CardTitle>
              <CardDescription>Frequência mínima exigida: {rule.minAttendancePct}%.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <AttendanceSummary
                minPct={rule.minAttendancePct}
                rows={roster.map((r) => ({
                  enrollmentId: r.enrollment.id,
                  studentName: r.student.name,
                  editable: r.editable,
                  lockReason: r.lockReason,
                  totals: attendanceTotalsOf(assignmentId, r.enrollment.id),
                }))}
              />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
