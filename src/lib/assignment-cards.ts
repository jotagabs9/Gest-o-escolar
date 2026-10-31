import type { AssignmentCardData } from "@/components/assessment/assignment-cards";
import { EVALUATION_TYPE_LABEL } from "@/lib/assessment";
import { classGroups, curricula, curriculumComponents, stageLabel } from "@/lib/mock/academic";
import { assignmentStats, assignmentsOfTeacher, getRule } from "@/lib/mock/assessment";
import { formatGrade } from "@/lib/format";

/** Cards das alocações do professor (só as dele). */
export function buildAssignmentCards(teacherId: string, mode: "notas" | "frequencia"): AssignmentCardData[] {
  return assignmentsOfTeacher(teacherId).flatMap((a) => {
    const component = curriculumComponents.find((c) => c.id === a.componentId);
    const cls = classGroups.find((c) => c.id === a.classGroupId);
    if (!component || !cls) return [];
    const curriculum = curricula.find((c) => c.id === component.curriculumId);
    const rule = getRule(component.id);
    const stats = assignmentStats(a.id);

    const progress =
      mode === "notas"
        ? {
            label: `Lançamentos do ${stats.period?.name ?? "período"}`,
            value: stats.students ? (stats.graded / stats.students) * 100 : 0,
            hint: `${stats.graded}/${stats.students} alunos`,
          }
        : {
            label: "Aulas com chamada",
            value: stats.lessonsTotal ? (stats.lessonsRegistered / stats.lessonsTotal) * 100 : 0,
            hint: `${stats.lessonsRegistered}/${stats.lessonsTotal} aulas`,
          };

    const ruleSummary = rule
      ? rule.evaluationType === "NUMERIC"
        ? `Média mínima ${formatGrade(rule.passingGrade)} · frequência mínima ${rule.minAttendancePct}%`
        : `${EVALUATION_TYPE_LABEL[rule.evaluationType]} · frequência mínima ${rule.minAttendancePct}%`
      : null;

    return [
      {
        id: a.id,
        componentName: component.name,
        classLabel: `Turma ${cls.name}`,
        stageLabel: stageLabel(cls.stageId),
        curriculumCode: curriculum?.code ?? "—",
        evaluationType: rule?.evaluationType ?? null,
        students: stats.students,
        progress,
        ruleSummary,
      },
    ];
  });
}
