/**
 * MOCK: Dashboard do Admin da Escola.
 * TODO (Prisma): trocar por queries filtradas pela escola da sessão (RLS cuida do isolamento).
 */
export interface AdminDashboardData {
  academicYear: {
    name: string;
    status: string;
    startsAt: string;
    endsAt: string;
    progressPct: number;
    currentTerm: string;
  };
  stats: {
    activeStudents: number;
    studentsDelta: string;
    teachers: number;
    teachersWithoutAssignment: number;
    classGroups: number;
    stages: number;
    enrollments: number;
    pendingEnrollments: number;
  };
  /** Vínculos por matriz. Um aluno pode ter mais de uma (ex.: Ensino Médio + Técnico). */
  enrollmentsByCurriculum: { curriculum: string; role: string; students: number }[];
  recentEnrollments: {
    id: string;
    student: string;
    classGroup: string;
    curricula: string[];
    date: string;
    status: "ACTIVE" | "PENDING";
  }[];
  alerts: {
    id: string;
    severity: "warning" | "danger";
    title: string;
    description: string;
    href: string;
  }[];
}

export const adminDashboard: AdminDashboardData = {
  academicYear: {
    name: "2026",
    status: "Em andamento",
    startsAt: "02/02/2026",
    endsAt: "18/12/2026",
    progressPct: 84,
    currentTerm: "4º bimestre",
  },
  stats: {
    activeStudents: 842,
    studentsDelta: "+14 no último mês",
    teachers: 56,
    teachersWithoutAssignment: 5,
    classGroups: 28,
    stages: 3,
    enrollments: 861,
    pendingEnrollments: 19,
  },
  enrollmentsByCurriculum: [
    { curriculum: "Formação Geral Básica (Ensino Médio)", role: "Geral", students: 842 },
    { curriculum: "Técnico em Desenvolvimento de Sistemas", role: "Técnico", students: 214 },
    { curriculum: "Técnico em Administração", role: "Técnico", students: 108 },
    { curriculum: "Itinerário: Linguagens e suas Tecnologias", role: "Itinerário", students: 96 },
  ],
  recentEnrollments: [
    { id: "en_01", student: "Ana Beatriz Almeida", classGroup: "3º A", curricula: ["Ensino Médio", "Téc. Des. de Sistemas"], date: "17/10/2026", status: "ACTIVE" },
    { id: "en_02", student: "Pedro Henrique Lima", classGroup: "1º C", curricula: ["Ensino Médio"], date: "16/10/2026", status: "ACTIVE" },
    { id: "en_03", student: "Larissa Ferreira", classGroup: "2º B", curricula: ["Ensino Médio", "Téc. Administração"], date: "15/10/2026", status: "PENDING" },
    { id: "en_04", student: "Gabriel Souza Rocha", classGroup: "1º A", curricula: ["Ensino Médio"], date: "14/10/2026", status: "ACTIVE" },
    { id: "en_05", student: "Isabela Martins", classGroup: "3º B", curricula: ["Ensino Médio", "Téc. Administração"], date: "13/10/2026", status: "PENDING" },
  ],
  alerts: [
    { id: "al_01", severity: "danger", title: "3 componentes sem professor alocado", description: "Sem alocação, ninguém consegue lançar notas e frequência neles.", href: "/admin/estrutura/matrizes" },
    { id: "al_02", severity: "warning", title: "19 matrículas pendentes", description: "Aguardam documentos ou confirmação da secretaria.", href: "/admin/matriculas" },
    { id: "al_03", severity: "warning", title: "2 turmas sem matriz vinculada", description: "Vincule uma matriz curricular para liberar a matrícula.", href: "/admin/estrutura/turmas" },
  ],
};
