/**
 * MOCK: monta o boletim de uma matrícula.
 * Cadeia: Enrollment → EnrollmentCurriculum → Curriculum → CurriculumComponent → notas e frequência.
 * TODO (Prisma): trocar por uma query/consulta agregada na runtime role (e respeitar o congelamento do histórico).
 */
import {
  SECTION_ORDER,
  SECTION_LABEL,
  computeOutcome,
  sectionOf,
  type AssessmentRule,
  type AttendanceTotals,
  type Outcome,
  type PeriodGrade,
  type ReportSection,
} from "@/lib/assessment";
import { classGroups, curricula, curriculumComponents, academicYears } from "@/lib/mock/academic";
import {
  attendanceTotalsOf,
  getRule,
  gradesOf,
  periodsOfYear,
  rosterOfAssignment,
  type AcademicPeriod,
} from "@/lib/mock/assessment";
import {
  enrollmentCurricula,
  enrollments,
  students,
  teacherAssignments,
  teacherProfiles,
  type Enrollment,
  type EnrollmentCurriculum,
  type Student,
} from "@/lib/mock/people";

export interface ReportRow {
  componentId: string;
  name: string;
  hours: number;
  curriculumId: string;
  linkStatus: string;
  teacherName: string | null;
  rule: AssessmentRule | null;
  grades: (PeriodGrade | undefined)[];
  attendance: AttendanceTotals | null;
  outcome: Outcome;
  attendanceRisk: boolean;
}

export interface ReportSectionData {
  key: ReportSection;
  label: string;
  links: { curriculumId: string; code: string; role: string; status: string }[];
  rows: ReportRow[];
}

export interface ReportCard {
  enrollment: Enrollment;
  student: Student;
  classGroupName: string;
  stageClassId: string | undefined;
  yearName: string;
  periods: AcademicPeriod[];
  links: EnrollmentCurriculum[];
  sections: ReportSectionData[];
  summary: {
    overallAverage: number | null;
    overallAttendance: number | null;
    alerts: number;
    approved: number;
    recovery: number;
    failed: number;
    inProgress: number;
  };
}

export function buildReportCard(enrollmentId: string): ReportCard | null {
  const enrollment = enrollments.find((e) => e.id === enrollmentId);
  const student = enrollment && students.find((s) => s.id === enrollment.studentId);
  if (!enrollment || !student) return null;

  const cls = classGroups.find((c) => c.id === enrollment.classGroupId);
  const year = academicYears.find((y) => y.id === enrollment.academicYearId);
  const periods = periodsOfYear(enrollment.academicYearId);
  const links = enrollmentCurricula.filter((l) => l.enrollmentId === enrollmentId);

  const bySection = new Map<ReportSection, ReportSectionData>();

  for (const link of links) {
    const curriculum = curricula.find((c) => c.id === link.curriculumId);
    for (const component of curriculumComponents.filter((c) => c.curriculumId === link.curriculumId)) {
      const key = sectionOf(component.type);
      if (!bySection.has(key)) bySection.set(key, { key, label: SECTION_LABEL[key], links: [], rows: [] });
      const section = bySection.get(key)!;
      if (curriculum && !section.links.some((l) => l.curriculumId === curriculum.id)) {
        section.links.push({ curriculumId: curriculum.id, code: curriculum.code, role: link.role, status: link.status });
      }

      const rule = getRule(component.id);
      const assignment = teacherAssignments.find(
        (a) => a.componentId === component.id && rosterOfAssignment(a.id).some((r) => r.enrollment.id === enrollmentId),
      );
      const teacher = assignment && teacherProfiles.find((t) => t.id === assignment.teacherId);
      const grades = gradesOf(enrollmentId, component.id, periods);
      const attendance = assignment ? attendanceTotalsOf(assignment.id, enrollmentId) : null;
      const outcome: Outcome = rule
        ? computeOutcome(rule, grades, periods.length, attendance?.pct ?? null)
        : { average: null, status: "NO_DATA", isFinal: false, failedByAttendance: false };

      section.rows.push({
        componentId: component.id,
        name: component.name,
        hours: component.workloadHours,
        curriculumId: component.curriculumId,
        linkStatus: link.status,
        teacherName: teacher?.name ?? null,
        rule,
        grades,
        attendance,
        outcome,
        attendanceRisk: !!rule && attendance?.pct != null && attendance.pct < rule.minAttendancePct,
      });
    }
  }

  const sections = SECTION_ORDER.filter((k) => bySection.has(k)).map((k) => bySection.get(k)!);
  const rows = sections.flatMap((s) => s.rows);

  const avgs = rows.map((r) => r.outcome.average).filter((v): v is number => v !== null);
  const attended = rows.reduce((s, r) => s + (r.attendance?.attended ?? 0), 0);
  const total = rows.reduce((s, r) => s + (r.attendance?.total ?? 0), 0);
  const count = (st: string) => rows.filter((r) => r.outcome.status === st).length;

  return {
    enrollment,
    student,
    classGroupName: cls?.name ?? "—",
    stageClassId: cls?.id,
    yearName: year?.name ?? "—",
    periods,
    links,
    sections,
    summary: {
      overallAverage: avgs.length ? Math.round((avgs.reduce((s, v) => s + v, 0) / avgs.length) * 10) / 10 : null,
      overallAttendance: total > 0 ? (attended / total) * 100 : null,
      alerts: rows.filter((r) => ["ATTENTION", "RECOVERY", "FAILED"].includes(r.outcome.status) || r.attendanceRisk).length,
      approved: count("APPROVED"),
      recovery: count("RECOVERY"),
      failed: count("FAILED"),
      inProgress: count("IN_PROGRESS") + count("ATTENTION"),
    },
  };
}
