import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpenCheck, FileWarning } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { GradeGrid, type GradeGridRow } from "@/components/assessment/grade-grid";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList } from "@/components/people/detail-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVALUATION_TYPE_LABEL } from "@/lib/assessment";
import { formatGrade } from "@/lib/format";
import { classGroups, curricula, curriculumComponents, stageLabel } from "@/lib/mock/academic";
import {
  attendanceTotalsOf,
  getAssignment,
  getRule,
  gradesOf,
  periodsOfYear,
  rosterOfAssignment,
} from "@/lib/mock/assessment";
import { requireTeacher } from "@/lib/teacher-context";

export const metadata: Metadata = { title: "Notas | Gestão Escolar" };

export default async function AssignmentGradesPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { teacherId } = await requireTeacher();
  const { assignmentId } = await params;

  // Regra do domínio: só abre quem tem a alocação. Qualquer outra alocação responde como inexistente.
  const assignment = getAssignment(assignmentId);
  if (!assignment || assignment.teacherId !== teacherId) notFound();

  const component = curriculumComponents.find((c) => c.id === assignment.componentId);
  const cls = classGroups.find((c) => c.id === assignment.classGroupId);
  if (!component || !cls) notFound();

  const curriculum = curricula.find((c) => c.id === component.curriculumId);
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
      <BackLink href="/professor/notas">Lançamento de notas</BackLink>

      <PageHeader
        title={component.name}
        description={`Turma ${cls.name} · ${stageLabel(cls.stageId)}${curriculum ? ` · ${curriculum.code}` : ""}`}
      />

      {!rule ? (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={FileWarning}
              title="Componente sem regra de avaliação"
              description="Sem a regra (tipo de avaliação, média mínima e frequência mínima), não é possível lançar notas. Peça à secretaria para configurar."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regra de avaliação do componente</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Tipo de avaliação", value: EVALUATION_TYPE_LABEL[rule.evaluationType] },
                  ...(rule.evaluationType === "NUMERIC"
                    ? [
                        { label: "Nota máxima", value: formatGrade(rule.maxGrade) },
                        { label: "Média mínima para aprovação", value: formatGrade(rule.passingGrade) },
                        { label: "Recuperação a partir de", value: formatGrade(rule.recoveryMinGrade) },
                      ]
                    : []),
                  { label: "Frequência mínima", value: `${rule.minAttendancePct}%` },
                  { label: "Falta justificada", value: rule.justifiedCountsAsPresent ? "conta como presença" : "conta como falta" },
                ]}
              />
            </CardContent>
          </Card>

          {rows.length === 0 ? (
            <Card>
              <CardContent className="py-2">
                <EmptyState
                  icon={BookOpenCheck}
                  title="Nenhum aluno nesta alocação"
                  description="Ainda não há alunos com vínculo ativo na matriz deste componente."
                />
              </CardContent>
            </Card>
          ) : (
            <GradeGrid rule={rule} periods={periods.map((p) => ({ id: p.id, name: p.name, status: p.status }))} rows={rows} />
          )}
        </>
      )}
    </>
  );
}
