import type { GradingRules } from "@/lib/academic";

/**
 * MOCK: Dashboard do Aluno/Responsável.
 * Um responsável pode acompanhar mais de um aluno.
 * TODO (Prisma): Student → Enrollment → EnrollmentCurriculum → CurriculumComponent,
 * restrito aos alunos vinculados ao usuário (Guardian) ou ao próprio aluno.
 */
export interface StudentComponentRecord {
  id: string;
  name: string; // CurriculumComponent
  curriculum: string; // matriz de origem (papel do vínculo)
  teacher: string;
  grades: (number | null)[]; // um item por bimestre; null = ainda não lançada
  attendancePct: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  classGroup: string;
  curricula: string[];
  components: StudentComponentRecord[];
}

export interface StudentDashboardData {
  currentTerm: string;
  rules: GradingRules;
  students: StudentRecord[];
  notices: { id: string; title: string; date: string }[];
}

export const studentDashboard: StudentDashboardData = {
  currentTerm: "4º bimestre",
  rules: { passingGrade: 6, minAttendancePct: 75 },
  students: [
    {
      id: "st_01",
      name: "Ana Beatriz Almeida",
      classGroup: "3º A",
      curricula: ["Ensino Médio", "Técnico em Desenvolvimento de Sistemas"],
      components: [
        { id: "c1", name: "Língua Portuguesa", curriculum: "Formação Geral", teacher: "Helena Duarte", grades: [8.0, 8.5, 9.0, null], attendancePct: 96 },
        { id: "c2", name: "Matemática", curriculum: "Formação Geral", teacher: "Ricardo Alves", grades: [6.5, 7.0, 5.5, null], attendancePct: 92 },
        { id: "c3", name: "Física", curriculum: "Formação Geral", teacher: "Camila Torres", grades: [5.0, 5.5, 6.0, null], attendancePct: 88 },
        { id: "c4", name: "Banco de Dados", curriculum: "Técnico", teacher: "Rafael Nogueira", grades: [9.0, 8.5, 9.5, null], attendancePct: 100 },
        { id: "c5", name: "Programação de Aplicativos", curriculum: "Técnico", teacher: "Rafael Nogueira", grades: [8.0, 9.0, 8.5, null], attendancePct: 97 },
        { id: "c6", name: "Projeto de Vida", curriculum: "Formação Geral", teacher: "Sérgio Matos", grades: [9.0, 9.0, 8.5, null], attendancePct: 73 },
      ],
    },
    {
      id: "st_02",
      name: "Pedro Almeida",
      classGroup: "1º C",
      curricula: ["Ensino Médio"],
      components: [
        { id: "c7", name: "Língua Portuguesa", curriculum: "Formação Geral", teacher: "Helena Duarte", grades: [7.0, 6.5, 7.5, null], attendancePct: 94 },
        { id: "c8", name: "Matemática", curriculum: "Formação Geral", teacher: "Ricardo Alves", grades: [4.5, 5.0, 5.5, null], attendancePct: 90 },
        { id: "c9", name: "Biologia", curriculum: "Formação Geral", teacher: "Daniela Pires", grades: [7.5, 8.0, 7.0, null], attendancePct: 95 },
        { id: "c10", name: "História", curriculum: "Formação Geral", teacher: "Márcio Lopes", grades: [8.0, 7.5, 8.0, null], attendancePct: 98 },
      ],
    },
  ],
  notices: [
    { id: "n1", title: "Entrega das notas do 4º bimestre até 04/12", date: "15/10/2026" },
    { id: "n2", title: "Reunião de pais e responsáveis: 28/10, 19h", date: "12/10/2026" },
    { id: "n3", title: "Recuperação paralela de Matemática e Física", date: "08/10/2026" },
  ],
};
