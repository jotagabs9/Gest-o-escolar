/**
 * MOCK: Dashboard do Professor.
 * Só existem aqui as alocações (TeacherAssignment) do professor logado.
 * TODO (Prisma): listar TeacherAssignment where teacherId = sessão, com CurriculumComponent e ClassGroup.
 */
export interface TeacherAssignmentSummary {
  id: string; // TeacherAssignment.id
  component: string; // CurriculumComponent
  classGroup: string;
  curriculum: string;
  students: number;
  weeklyLessons: number;
  gradesEntered: number; // alunos com nota lançada no bimestre atual
  lessonsRecorded: number;
  lessonsPlanned: number;
}

export interface TeacherDashboardData {
  term: { name: string; closesAt: string }; // ISO yyyy-mm-dd
  assignments: TeacherAssignmentSummary[];
  today: { time: string; component: string; classGroup: string; room: string; attendanceDone: boolean }[];
}

export const teacherDashboard: TeacherDashboardData = {
  term: { name: "4º bimestre", closesAt: "2026-12-04" },
  assignments: [
    { id: "ta_01", component: "Banco de Dados", classGroup: "3º A", curriculum: "Técnico em Desenvolvimento de Sistemas", students: 34, weeklyLessons: 4, gradesEntered: 28, lessonsRecorded: 42, lessonsPlanned: 48 },
    { id: "ta_02", component: "Programação de Aplicativos", classGroup: "3º A", curriculum: "Técnico em Desenvolvimento de Sistemas", students: 34, weeklyLessons: 4, gradesEntered: 34, lessonsRecorded: 46, lessonsPlanned: 48 },
    { id: "ta_03", component: "Banco de Dados", classGroup: "2º B", curriculum: "Técnico em Desenvolvimento de Sistemas", students: 31, weeklyLessons: 4, gradesEntered: 19, lessonsRecorded: 38, lessonsPlanned: 44 },
    { id: "ta_04", component: "Modelagem de Sistemas I", classGroup: "1º D", curriculum: "Técnico em Desenvolvimento de Sistemas", students: 29, weeklyLessons: 2, gradesEntered: 29, lessonsRecorded: 30, lessonsPlanned: 32 },
  ],
  today: [
    { time: "07:30", component: "Programação de Aplicativos", classGroup: "3º A", room: "Lab. 2", attendanceDone: true },
    { time: "09:20", component: "Banco de Dados", classGroup: "3º A", room: "Lab. 2", attendanceDone: false },
    { time: "13:30", component: "Banco de Dados", classGroup: "2º B", room: "Lab. 1", attendanceDone: false },
  ],
};
