/**
 * MOCK: Avaliação e Frequência (Lote 4).
 * Notas e frequência são por CurriculumComponent + AcademicPeriod, ligadas à matrícula do aluno.
 * Quem lança é o professor com TeacherAssignment (Lote 3) no componente e na turma.
 *
 * Regra de lista de alunos (mock): matrículas do ano da turma com vínculo (EnrollmentCurriculum) na matriz do
 * componente, quando a matrícula é da própria turma OU o vínculo é de Formação Técnica (turma técnica própria).
 * TODO (Prisma): trocar por queries na runtime role; a RLS e a alocação do professor valem no banco.
 */
import {
  attendanceTotals,
  type AssessmentRule,
  type AttendanceStatus,
  type AttendanceTotals,
  type ConceptOption,
  type PeriodGrade,
} from "@/lib/assessment";
import { classGroups, curriculumComponents } from "@/lib/mock/academic";
import {
  enrollmentCurricula,
  enrollments,
  students,
  teacherAssignments,
  type Enrollment,
  type EnrollmentCurriculum,
  type Student,
  type TeacherAssignment,
} from "@/lib/mock/people";

/* ---------- Períodos ---------- */

export interface AcademicPeriod {
  id: string;
  academicYearId: string;
  name: string;
  order: number;
  startsAt: string;
  endsAt: string;
  /** Período encerrado é somente leitura para o professor. */
  status: "OPEN" | "CLOSED";
}

export const academicPeriods: AcademicPeriod[] = [
  { id: "ap_2026_1", academicYearId: "ay_2026", name: "1º bimestre", order: 1, startsAt: "2026-02-02", endsAt: "2026-04-17", status: "CLOSED" },
  { id: "ap_2026_2", academicYearId: "ay_2026", name: "2º bimestre", order: 2, startsAt: "2026-04-20", endsAt: "2026-07-03", status: "CLOSED" },
  { id: "ap_2026_3", academicYearId: "ay_2026", name: "3º bimestre", order: 3, startsAt: "2026-07-27", endsAt: "2026-10-02", status: "CLOSED" },
  { id: "ap_2026_4", academicYearId: "ay_2026", name: "4º bimestre", order: 4, startsAt: "2026-10-05", endsAt: "2026-12-04", status: "OPEN" },
];

/* ---------- Regras de avaliação (AssessmentRule por componente) ---------- */

const LIFE_PROJECT_CONCEPTS: ConceptOption[] = [
  { value: "PS", short: "PS", label: "Plenamente satisfatório", satisfactory: true },
  { value: "S", short: "S", label: "Satisfatório", satisfactory: true },
  { value: "ED", short: "ED", label: "Em desenvolvimento", satisfactory: false },
  { value: "NS", short: "NS", label: "Não satisfatório", satisfactory: false },
];

const DIAGNOSTIC_CONCEPTS: ConceptOption[] = [
  { value: "AD", short: "AD", label: "Adequado", satisfactory: true },
  { value: "DV", short: "DV", label: "Em desenvolvimento", satisfactory: false },
  { value: "NA", short: "NA", label: "Necessita apoio", satisfactory: false },
];

const numericRule = (componentId: string, overrides: Partial<AssessmentRule> = {}): AssessmentRule => ({
  id: `ar_${componentId}`,
  componentId,
  evaluationType: "NUMERIC",
  maxGrade: 10,
  passingGrade: 6,
  recoveryMinGrade: 4,
  minAttendancePct: 75,
  justifiedCountsAsPresent: false,
  concepts: [],
  ...overrides,
});

const technical = { passingGrade: 7, recoveryMinGrade: 5, minAttendancePct: 80, justifiedCountsAsPresent: true };

export const assessmentRules: AssessmentRule[] = [
  numericRule("cc_01"),
  numericRule("cc_02"),
  numericRule("cc_03"),
  numericRule("cc_04"),
  numericRule("cc_05"),
  numericRule("cc_06"),
  numericRule("cc_07", { evaluationType: "DESCRIPTIVE", concepts: LIFE_PROJECT_CONCEPTS, passingGrade: 0, recoveryMinGrade: 0 }),
  numericRule("cc_08"),
  numericRule("cc_09"),
  numericRule("cc_10", { evaluationType: "DIAGNOSTIC", concepts: DIAGNOSTIC_CONCEPTS, passingGrade: 0, recoveryMinGrade: 0 }),
  numericRule("cc_11", technical),
  numericRule("cc_12", technical),
  numericRule("cc_13", technical),
  numericRule("cc_14", technical),
  numericRule("cc_15", technical),
  numericRule("cc_16", technical),
];

/* ---------- Notas ---------- */

export interface GradeRecord {
  enrollmentId: string;
  componentId: string;
  periodId: string;
  numeric?: number;
  concept?: string;
}

/** Valores por bimestre, na ordem; null = não lançado. Número = nota; texto = conceito. */
const g = (enrollmentId: string, componentId: string, values: (number | string | null)[]): GradeRecord[] =>
  values.flatMap((v, i) =>
    v === null
      ? []
      : [
          {
            enrollmentId,
            componentId,
            periodId: `ap_2026_${i + 1}`,
            ...(typeof v === "number" ? { numeric: v } : { concept: v }),
          },
        ],
  );

export const gradeRecords: GradeRecord[] = [
  // en_01 Ana Beatriz (Formação Geral + Técnica DS)
  ...g("en_01", "cc_01", [8.0, 8.5, 9.0, null]),
  ...g("en_01", "cc_02", [6.5, 7.0, 5.5, null]),
  ...g("en_01", "cc_03", [5.0, 5.5, 6.0, null]),
  ...g("en_01", "cc_04", [7.5, 8.0, 7.0, null]),
  ...g("en_01", "cc_07", ["S", "S", "S", null]),
  ...g("en_01", "cc_11", [9.0, 8.5, 9.5, null]),
  ...g("en_01", "cc_12", [8.0, 9.0, 8.5, null]),
  // en_09 Matheus (Formação Geral + Itinerário)
  ...g("en_09", "cc_01", [7.0, 7.5, 8.0, null]),
  ...g("en_09", "cc_02", [8.5, 9.0, 8.0, null]),
  ...g("en_09", "cc_03", [6.0, 6.5, 7.0, null]),
  ...g("en_09", "cc_04", [7.0, 7.5, 8.0, null]),
  ...g("en_09", "cc_07", ["PS", "S", "S", null]),
  // en_12 Rafael Oliveira (resultado final: todos os bimestres)
  ...g("en_12", "cc_01", [7.0, 7.5, 8.0, 8.0]),
  ...g("en_12", "cc_02", [6.0, 6.5, 6.0, 5.0]),
  ...g("en_12", "cc_03", [6.5, 7.0, 7.0, 7.0]),
  ...g("en_12", "cc_04", [7.5, 7.0, 8.0, 8.0]),
  ...g("en_12", "cc_07", ["S", "PS", "S", "S"]),
  // en_06 Pedro Henrique
  ...g("en_06", "cc_01", [9.0, 8.5, 9.0, null]),
  ...g("en_06", "cc_02", [3.0, 4.0, 3.5, 3.0]),
  ...g("en_06", "cc_03", [5.5, 5.0, 5.5, null]),
  ...g("en_06", "cc_07", ["PS", "PS", "PS", null]),
  // en_10 Beatriz (Geral + Técnica desistente)
  ...g("en_10", "cc_01", [7.0, 6.5, 7.0, null]),
  ...g("en_10", "cc_02", [8.0, 8.5, 9.0, null]),
  ...g("en_10", "cc_03", [7.0, 7.5, 7.0, null]),
  ...g("en_10", "cc_07", ["S", "S", "ED", null]),
  ...g("en_10", "cc_11", [6.0, 5.5, null, null]),
  // en_13 Thiago (transferido no 2º bimestre)
  ...g("en_13", "cc_01", [6.0, 5.5, null, null]),
  ...g("en_13", "cc_02", [5.0, 4.5, null, null]),
  ...g("en_13", "cc_03", [6.0, 6.0, null, null]),
  ...g("en_13", "cc_07", ["S", "S", null, null]),
  // en_07 Lucas (Técnica DS)
  ...g("en_07", "cc_11", [7.5, 8.0, 7.0, 8.0]),
  ...g("en_07", "cc_12", [8.5, 9.0, 9.5, null]),
  // en_08 Júlia (Técnica Administração)
  ...g("en_08", "cc_15", [7.5, 8.0, 7.0, null]),
];

/* ---------- Lista de alunos de uma alocação ---------- */

export interface RosterRow {
  enrollment: Enrollment;
  student: Student;
  link: EnrollmentCurriculum;
  editable: boolean;
  lockReason?: string;
}

const ENROLLMENT_LOCK: Record<string, string> = {
  PENDING: "Matrícula pendente",
  TRANSFERRED: "Matrícula transferida",
  COMPLETED: "Matrícula concluída",
};
const LINK_LOCK: Record<string, string> = {
  PENDING: "Vínculo pendente",
  DROPPED: "Desistente nesta matriz",
  TRANSFERRED: "Transferido da matriz",
  COMPLETED: "Matriz concluída",
};

export function getAssignment(id: string): TeacherAssignment | null {
  return teacherAssignments.find((a) => a.id === id) ?? null;
}

export function assignmentsOfTeacher(teacherId: string): TeacherAssignment[] {
  return teacherAssignments.filter((a) => a.teacherId === teacherId);
}

export function rosterOfAssignment(assignmentId: string): RosterRow[] {
  const assignment = getAssignment(assignmentId);
  const component = assignment && curriculumComponents.find((c) => c.id === assignment.componentId);
  const cls = assignment && classGroups.find((c) => c.id === assignment.classGroupId);
  if (!assignment || !component || !cls) return [];

  const rows: RosterRow[] = [];
  for (const enrollment of enrollments) {
    if (enrollment.academicYearId !== cls.academicYearId || enrollment.status === "CANCELLED") continue;
    const link = enrollmentCurricula.find(
      (l) => l.enrollmentId === enrollment.id && l.curriculumId === component.curriculumId,
    );
    if (!link) continue;
    if (!(link.role === "TECHNICAL_EDUCATION" || enrollment.classGroupId === assignment.classGroupId)) continue;
    const student = students.find((s) => s.id === enrollment.studentId);
    if (!student) continue;

    let lockReason: string | undefined;
    if (enrollment.status !== "ACTIVE") lockReason = ENROLLMENT_LOCK[enrollment.status] ?? "Matrícula inativa";
    else if (link.status !== "ACTIVE") lockReason = LINK_LOCK[link.status] ?? "Vínculo inativo";
    rows.push({ enrollment, student, link, editable: !lockReason, lockReason });
  }
  return rows.sort((a, b) => a.student.name.localeCompare(b.student.name, "pt-BR"));
}

/* ---------- Consultas de notas ---------- */

export function getRule(componentId: string): AssessmentRule | null {
  return assessmentRules.find((r) => r.componentId === componentId) ?? null;
}

export function periodsOfYear(academicYearId: string): AcademicPeriod[] {
  return academicPeriods.filter((p) => p.academicYearId === academicYearId).sort((a, b) => a.order - b.order);
}

export function currentPeriod(academicYearId: string): AcademicPeriod | null {
  return periodsOfYear(academicYearId).find((p) => p.status === "OPEN") ?? null;
}

/** Notas do aluno no componente, na ordem dos períodos (undefined = não lançado). */
export function gradesOf(enrollmentId: string, componentId: string, periods: AcademicPeriod[]): (PeriodGrade | undefined)[] {
  return periods.map((p) => {
    const r = gradeRecords.find((x) => x.enrollmentId === enrollmentId && x.componentId === componentId && x.periodId === p.id);
    return r ? { numeric: r.numeric, concept: r.concept } : undefined;
  });
}

/* ---------- Aulas e frequência ---------- */

export interface LessonRecord {
  id: string;
  assignmentId: string;
  index: number;
  date: string;
  periodId: string;
  topic: string;
}

/** Datas semanais de aula dentro dos períodos, até a data atual do mock. */
const LESSON_DATES: { date: string; periodId: string }[] = (() => {
  const out: { date: string; periodId: string }[] = [];
  const d = new Date(Date.UTC(2026, 4, 8));
  const end = "2026-10-23";
  while (true) {
    const iso = d.toISOString().slice(0, 10);
    if (iso > end) break;
    const period = academicPeriods.find((p) => iso >= p.startsAt && iso <= p.endsAt);
    if (period) out.push({ date: iso, periodId: period.id });
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
})();

export const lessonRecords: LessonRecord[] = teacherAssignments.flatMap((a) => {
  const component = curriculumComponents.find((c) => c.id === a.componentId);
  return LESSON_DATES.map((l, i) => ({
    id: `lr_${a.id}_${i}`,
    assignmentId: a.id,
    index: i,
    date: l.date,
    periodId: l.periodId,
    topic: `${component?.name ?? "Aula"}: conteúdo da aula ${i + 1}`,
  }));
});

const abs = (...idx: number[]): Record<number, AttendanceStatus> =>
  Object.fromEntries(idx.map((i) => [i, "ABSENT" as AttendanceStatus]));

/** Exceções à presença total. Chave: `${assignmentId}:${enrollmentId}`; valor: índice da aula → status. */
const ATTENDANCE_OVERRIDES: Record<string, Record<number, AttendanceStatus>> = {
  "ta_10:en_01": { 3: "ABSENT", 10: "JUSTIFIED", 17: "LATE" },
  "ta_10:en_07": { ...abs(5, 6, 12, 13, 19), 20: "JUSTIFIED" },
  "ta_11:en_01": abs(7),
  "ta_11:en_07": { 2: "LATE", 9: "JUSTIFIED" },
  "ta_01:en_01": abs(4, 11),
  "ta_01:en_12": { ...abs(1, 3, 5, 9, 12, 16), 8: "JUSTIFIED" },
  "ta_03:en_01": abs(2, 3, 9),
  "ta_03:en_12": abs(14, 15),
  "ta_04:en_06": abs(1, 3, 5, 8, 11, 14),
  "ta_04:en_10": { 7: "LATE" },
  "ta_05:en_01": abs(6),
  "ta_08:en_01": abs(0, 4, 8, 12, 16, 19),
  "ta_08:en_09": { 10: "JUSTIFIED" },
};

/** Aulas ainda sem chamada registrada (índices). */
const UNREGISTERED: Record<string, number[]> = { ta_10: [21], ta_01: [20, 21], ta_02: [21] };

export interface AttendanceRecord {
  lessonId: string;
  enrollmentId: string;
  status: AttendanceStatus;
}

const attendanceMap = new Map<string, AttendanceStatus>();
const registeredLessons = new Set<string>();

for (const a of teacherAssignments) {
  const roster = rosterOfAssignment(a.id).filter((r) => r.editable);
  for (const lesson of lessonRecords.filter((l) => l.assignmentId === a.id)) {
    if ((UNREGISTERED[a.id] ?? []).includes(lesson.index)) continue;
    registeredLessons.add(lesson.id);
    for (const r of roster) {
      const status = ATTENDANCE_OVERRIDES[`${a.id}:${r.enrollment.id}`]?.[lesson.index] ?? "PRESENT";
      attendanceMap.set(`${lesson.id}:${r.enrollment.id}`, status);
    }
  }
}

export function lessonsOfAssignment(assignmentId: string): LessonRecord[] {
  return lessonRecords.filter((l) => l.assignmentId === assignmentId);
}

export function isLessonRegistered(lessonId: string): boolean {
  return registeredLessons.has(lessonId);
}

export function attendanceStatusOf(lessonId: string, enrollmentId: string): AttendanceStatus | undefined {
  return attendanceMap.get(`${lessonId}:${enrollmentId}`);
}

export function attendanceTotalsOf(assignmentId: string, enrollmentId: string): AttendanceTotals | null {
  const assignment = getAssignment(assignmentId);
  if (!assignment) return null;
  const rule = getRule(assignment.componentId);
  const statuses = lessonsOfAssignment(assignmentId)
    .map((l) => attendanceStatusOf(l.id, enrollmentId))
    .filter((s): s is AttendanceStatus => !!s);
  if (statuses.length === 0) return null;
  return attendanceTotals(statuses, rule?.justifiedCountsAsPresent ?? false);
}

/** Indicadores da alocação no período atual (para cards e visão do admin). */
export function assignmentStats(assignmentId: string) {
  const assignment = getAssignment(assignmentId);
  const cls = assignment && classGroups.find((c) => c.id === assignment.classGroupId);
  const component = assignment && curriculumComponents.find((c) => c.id === assignment.componentId);
  const rule = component ? getRule(component.id) : null;
  const period = cls ? currentPeriod(cls.academicYearId) : null;
  const roster = rosterOfAssignment(assignmentId);
  const editable = roster.filter((r) => r.editable);

  const graded = period
    ? editable.filter((r) =>
        gradeRecords.some((x) => x.enrollmentId === r.enrollment.id && x.componentId === component?.id && x.periodId === period.id),
      ).length
    : 0;

  const lessons = lessonsOfAssignment(assignmentId);
  const registered = lessons.filter((l) => isLessonRegistered(l.id)).length;

  const pcts = editable
    .map((r) => attendanceTotalsOf(assignmentId, r.enrollment.id)?.pct)
    .filter((p): p is number => typeof p === "number");
  const avgAttendance = pcts.length ? pcts.reduce((s, p) => s + p, 0) / pcts.length : null;
  const atRisk = rule ? pcts.filter((p) => p < rule.minAttendancePct).length : 0;

  return {
    period,
    students: editable.length,
    rosterSize: roster.length,
    graded,
    lessonsTotal: lessons.length,
    lessonsRegistered: registered,
    avgAttendance,
    atRisk,
  };
}

/* ---------- Ponte TEMPORÁRIA entre o usuário real e o mock ---------- */
/**
 * Enquanto notas/frequência/boletim ainda são mock, o usuário autenticado (real) é ligado ao professor ou
 * responsável do mock pelo e-mail (mesmos e-mails do DEMO_* no .env). Some quando o bloco de dados reais entrar.
 */
const sameEmail = (a: string, b: string | undefined) => !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

export function mockTeacherIdForUser(email: string): string | null {
  return sameEmail(email, process.env.DEMO_TEACHER_EMAIL ?? "professor@escola.com") ? "t6" : null;
}

export function mockGuardianIdForUser(email: string): string | null {
  return sameEmail(email, process.env.DEMO_GUARDIAN_EMAIL ?? "responsavel@escola.com") ? "g_01" : null;
}
