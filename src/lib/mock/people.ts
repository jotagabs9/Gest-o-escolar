/**
 * MOCK: Pessoas e Matrículas (Lote 3).
 * Cadeia: ClassGroup → Enrollment → EnrollmentCurriculum → Curriculum → CurriculumComponent.
 * Professor só aparece via TeacherAssignment (componente + turma). Nunca direto no aluno.
 * IDs de turmas, matrizes e componentes são os do Lote 2 (lib/mock/academic.ts).
 *
 * TODO (Prisma): trocar cada função `list` e `get` por query com a runtime role (RLS filtra a escola).
 * Documentos são exibidos mascarados de propósito (LGPD): não trafegue CPF completo para a tela.
 */
import { academicYears, classGroups, stageLabel, type Option } from "@/lib/mock/academic";

/* ---------- Opções (enums) ---------- */

export type PersonStatus = "ACTIVE" | "INACTIVE";
export const PERSON_STATUS_OPTIONS: Option<PersonStatus>[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];

export type EnrollmentStatus = "PENDING" | "ACTIVE" | "TRANSFERRED" | "CANCELLED" | "COMPLETED";
export const ENROLLMENT_STATUS_OPTIONS: Option<EnrollmentStatus>[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "TRANSFERRED", label: "Transferida" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "COMPLETED", label: "Concluída" },
];

/** Status do vínculo com a matriz: independente do status da matrícula. */
export type LinkStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "DROPPED" | "TRANSFERRED";
export const LINK_STATUS_OPTIONS: Option<LinkStatus>[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "ACTIVE", label: "Cursando" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "DROPPED", label: "Desistente" },
  { value: "TRANSFERRED", label: "Transferido" },
];

export type EnrollmentRole = "GENERAL_EDUCATION" | "TECHNICAL_EDUCATION" | "ITINERARY" | "ELECTIVE" | "OTHER";
export const ENROLLMENT_ROLE_OPTIONS: Option<EnrollmentRole>[] = [
  { value: "GENERAL_EDUCATION", label: "Formação Geral" },
  { value: "TECHNICAL_EDUCATION", label: "Formação Técnica" },
  { value: "ITINERARY", label: "Itinerário" },
  { value: "ELECTIVE", label: "Eletiva" },
  { value: "OTHER", label: "Outro" },
];

/** Sugestão de papel ao escolher uma matriz (o papel real é gravado no vínculo). */
export const SUGGESTED_ROLE_BY_CURRICULUM: Record<string, EnrollmentRole> = {
  cu_fgb_3: "GENERAL_EDUCATION",
  cu_it_3: "ITINERARY",
  cu_ds_3: "TECHNICAL_EDUCATION",
  cu_adm_2: "TECHNICAL_EDUCATION",
  cu_fgb_1_27: "GENERAL_EDUCATION",
};

export const RELATIONSHIP_OPTIONS: Option[] = [
  { value: "Mãe", label: "Mãe" },
  { value: "Pai", label: "Pai" },
  { value: "Avó", label: "Avó" },
  { value: "Avô", label: "Avô" },
  { value: "Tio(a)", label: "Tio(a)" },
  { value: "Irmão(ã)", label: "Irmão(ã) maior de idade" },
  { value: "Responsável legal", label: "Responsável legal" },
  { value: "Outro", label: "Outro" },
];

/* ---------- Entidades ---------- */

export interface Student {
  id: string;
  name: string;
  birthDate: string; // ISO
  registrationNumber: string;
  email?: string;
  phone?: string;
  documentMasked?: string;
  status: PersonStatus;
}

export interface Guardian {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  documentMasked?: string;
}

export interface StudentGuardianLink {
  studentId: string;
  guardianId: string;
  relationship: string;
  isPrimary: boolean;
}

export interface TeacherProfile {
  id: string; // mesmo id do Teacher do Lote 2
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  status: PersonStatus;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  componentId: string; // CurriculumComponent
  classGroupId: string;
}

export interface Enrollment {
  id: string;
  number: string;
  studentId: string;
  academicYearId: string;
  classGroupId: string;
  status: EnrollmentStatus;
  enrolledAt: string; // ISO
}

export interface EnrollmentCurriculum {
  id: string;
  enrollmentId: string;
  curriculumId: string;
  role: EnrollmentRole;
  status: LinkStatus;
}

/* ---------- Dados ---------- */

export const students: Student[] = [
  { id: "s_01", name: "Ana Beatriz Almeida", birthDate: "2008-03-14", registrationNumber: "2023-0141", email: "ana.almeida@aluno.edu.br", phone: "(62) 99811-2040", documentMasked: "•••.482.917-••", status: "ACTIVE" },
  { id: "s_02", name: "Pedro Almeida", birthDate: "2011-06-02", registrationNumber: "2026-0007", documentMasked: "•••.115.630-••", status: "ACTIVE" },
  { id: "s_03", name: "Larissa Ferreira", birthDate: "2009-11-20", registrationNumber: "2026-0112", phone: "(62) 99654-7788", status: "ACTIVE" },
  { id: "s_04", name: "Gabriel Souza Rocha", birthDate: "2010-01-30", registrationNumber: "2026-0034", status: "ACTIVE" },
  { id: "s_05", name: "Isabela Martins", birthDate: "2008-09-09", registrationNumber: "2026-0151", email: "isabela.martins@aluno.edu.br", status: "ACTIVE" },
  { id: "s_06", name: "Pedro Henrique Lima", birthDate: "2009-04-18", registrationNumber: "2024-0203", status: "ACTIVE" },
  { id: "s_07", name: "Lucas Mendes", birthDate: "2008-07-25", registrationNumber: "2023-0088", phone: "(62) 99120-5566", status: "ACTIVE" },
  { id: "s_08", name: "Júlia Campos", birthDate: "2009-02-11", registrationNumber: "2024-0176", status: "ACTIVE" },
  { id: "s_09", name: "Matheus Ribeiro", birthDate: "2008-12-01", registrationNumber: "2023-0215", status: "ACTIVE" },
  { id: "s_10", name: "Beatriz Santos", birthDate: "2008-05-05", registrationNumber: "2023-0097", status: "ACTIVE" },
  { id: "s_11", name: "Caio Moreira", birthDate: "2007-08-19", registrationNumber: "2022-0310", email: "caio.moreira@email.com", status: "INACTIVE" },
  { id: "s_12", name: "Sofia Andrade", birthDate: "2012-03-03", registrationNumber: "2026-0188", status: "ACTIVE" },
  { id: "s_13", name: "Rafael Oliveira", birthDate: "2005-10-10", registrationNumber: "2025-0042", email: "rafael.oliveira@email.com", phone: "(62) 99301-1200", documentMasked: "•••.903.221-••", status: "ACTIVE" },
  { id: "s_14", name: "Thiago Barbosa", birthDate: "2008-10-02", registrationNumber: "2023-0120", status: "ACTIVE" },
];

export const guardians: Guardian[] = [
  { id: "g_01", name: "Carlos Almeida", email: "aluno@escola.edu.br", phone: "(62) 99811-2000", documentMasked: "•••.220.114-••" },
  { id: "g_02", name: "Fernanda Ferreira", email: "fernanda.ferreira@email.com", phone: "(62) 99654-7700" },
  { id: "g_03", name: "Roberto Rocha", phone: "(62) 98445-1022" },
  { id: "g_04", name: "Marta Martins", email: "marta.martins@email.com", phone: "(62) 99233-4501" },
  { id: "g_05", name: "Paulo Lima", phone: "(62) 99771-3080" },
  { id: "g_06", name: "Sandra Mendes", email: "sandra.mendes@email.com", phone: "(62) 99120-5500" },
  { id: "g_07", name: "Cláudia Campos", phone: "(62) 98133-9087" },
  { id: "g_08", name: "Renato Ribeiro", email: "renato.ribeiro@email.com", phone: "(62) 99902-6644" },
  { id: "g_09", name: "Helena Martins", phone: "(62) 3225-4410" },
  { id: "g_10", name: "Luciana Santos", phone: "(62) 99677-2318" },
  { id: "g_11", name: "Eduardo Barbosa", email: "eduardo.barbosa@email.com", phone: "(62) 99455-0173" },
  { id: "g_12", name: "Patrícia Andrade", email: "patricia.andrade@email.com", phone: "(62) 99188-7421" },
];

export const guardianLinks: StudentGuardianLink[] = [
  { studentId: "s_01", guardianId: "g_01", relationship: "Pai", isPrimary: true },
  { studentId: "s_02", guardianId: "g_01", relationship: "Pai", isPrimary: true },
  { studentId: "s_03", guardianId: "g_02", relationship: "Mãe", isPrimary: true },
  { studentId: "s_04", guardianId: "g_03", relationship: "Pai", isPrimary: true },
  { studentId: "s_05", guardianId: "g_04", relationship: "Mãe", isPrimary: true },
  { studentId: "s_05", guardianId: "g_09", relationship: "Avó", isPrimary: false },
  { studentId: "s_06", guardianId: "g_05", relationship: "Pai", isPrimary: true },
  { studentId: "s_07", guardianId: "g_06", relationship: "Mãe", isPrimary: true },
  { studentId: "s_08", guardianId: "g_07", relationship: "Mãe", isPrimary: true },
  { studentId: "s_09", guardianId: "g_08", relationship: "Pai", isPrimary: true },
  { studentId: "s_10", guardianId: "g_10", relationship: "Mãe", isPrimary: true },
  { studentId: "s_12", guardianId: "g_12", relationship: "Mãe", isPrimary: true },
  { studentId: "s_14", guardianId: "g_11", relationship: "Pai", isPrimary: true },
];

export const teacherProfiles: TeacherProfile[] = [
  { id: "t1", name: "Helena Duarte", email: "helena.duarte@escola.edu.br", phone: "(62) 99100-1001", specialty: "Língua Portuguesa", status: "ACTIVE" },
  { id: "t2", name: "Ricardo Alves", email: "ricardo.alves@escola.edu.br", phone: "(62) 99100-1002", specialty: "Matemática", status: "ACTIVE" },
  { id: "t3", name: "Camila Torres", email: "camila.torres@escola.edu.br", specialty: "Física", status: "ACTIVE" },
  { id: "t4", name: "Daniela Pires", email: "daniela.pires@escola.edu.br", specialty: "Biologia", status: "ACTIVE" },
  { id: "t5", name: "Sérgio Matos", email: "sergio.matos@escola.edu.br", specialty: "Projeto de Vida", status: "ACTIVE" },
  { id: "t6", name: "Rafael Nogueira", email: "professor@escola.edu.br", phone: "(62) 99100-1006", specialty: "Desenvolvimento de Sistemas", status: "ACTIVE" },
  { id: "t7", name: "Patrícia Lemos", email: "patricia.lemos@escola.edu.br", specialty: "Administração", status: "ACTIVE" },
  { id: "t8", name: "Márcio Lopes", email: "marcio.lopes@escola.edu.br", specialty: "História", status: "ACTIVE" },
];

export const teacherAssignments: TeacherAssignment[] = [
  { id: "ta_01", teacherId: "t1", componentId: "cc_01", classGroupId: "cg_04" },
  { id: "ta_02", teacherId: "t1", componentId: "cc_01", classGroupId: "cg_05" },
  { id: "ta_03", teacherId: "t2", componentId: "cc_02", classGroupId: "cg_04" },
  { id: "ta_04", teacherId: "t2", componentId: "cc_02", classGroupId: "cg_05" },
  { id: "ta_05", teacherId: "t3", componentId: "cc_03", classGroupId: "cg_04" },
  { id: "ta_06", teacherId: "t3", componentId: "cc_03", classGroupId: "cg_05" },
  { id: "ta_07", teacherId: "t4", componentId: "cc_04", classGroupId: "cg_04" },
  { id: "ta_08", teacherId: "t5", componentId: "cc_07", classGroupId: "cg_04" },
  { id: "ta_09", teacherId: "t5", componentId: "cc_07", classGroupId: "cg_05" },
  { id: "ta_10", teacherId: "t6", componentId: "cc_11", classGroupId: "cg_08" },
  { id: "ta_11", teacherId: "t6", componentId: "cc_12", classGroupId: "cg_08" },
  { id: "ta_12", teacherId: "t7", componentId: "cc_15", classGroupId: "cg_07" },
];

export const enrollments: Enrollment[] = [
  { id: "en_01", number: "2026-0001", studentId: "s_01", academicYearId: "ay_2026", classGroupId: "cg_04", status: "ACTIVE", enrolledAt: "2026-01-20" },
  { id: "en_02", number: "2026-0002", studentId: "s_02", academicYearId: "ay_2026", classGroupId: "cg_01", status: "ACTIVE", enrolledAt: "2026-01-21" },
  { id: "en_03", number: "2026-0003", studentId: "s_03", academicYearId: "ay_2026", classGroupId: "cg_07", status: "PENDING", enrolledAt: "2026-10-15" },
  { id: "en_04", number: "2026-0004", studentId: "s_04", academicYearId: "ay_2026", classGroupId: "cg_01", status: "ACTIVE", enrolledAt: "2026-01-22" },
  { id: "en_05", number: "2026-0005", studentId: "s_05", academicYearId: "ay_2026", classGroupId: "cg_08", status: "PENDING", enrolledAt: "2026-10-13" },
  { id: "en_06", number: "2026-0006", studentId: "s_06", academicYearId: "ay_2026", classGroupId: "cg_05", status: "ACTIVE", enrolledAt: "2026-01-23" },
  { id: "en_07", number: "2026-0007", studentId: "s_07", academicYearId: "ay_2026", classGroupId: "cg_08", status: "ACTIVE", enrolledAt: "2026-01-23" },
  { id: "en_08", number: "2026-0008", studentId: "s_08", academicYearId: "ay_2026", classGroupId: "cg_07", status: "ACTIVE", enrolledAt: "2026-01-24" },
  { id: "en_09", number: "2026-0009", studentId: "s_09", academicYearId: "ay_2026", classGroupId: "cg_04", status: "ACTIVE", enrolledAt: "2026-01-24" },
  { id: "en_10", number: "2026-0010", studentId: "s_10", academicYearId: "ay_2026", classGroupId: "cg_05", status: "ACTIVE", enrolledAt: "2026-01-25" },
  { id: "en_11", number: "2025-0099", studentId: "s_11", academicYearId: "ay_2025", classGroupId: "cg_11", status: "COMPLETED", enrolledAt: "2025-01-28" },
  { id: "en_12", number: "2026-0012", studentId: "s_13", academicYearId: "ay_2026", classGroupId: "cg_04", status: "ACTIVE", enrolledAt: "2026-02-03" },
  { id: "en_13", number: "2026-0013", studentId: "s_14", academicYearId: "ay_2026", classGroupId: "cg_05", status: "TRANSFERRED", enrolledAt: "2026-01-25" },
];

export const enrollmentCurricula: EnrollmentCurriculum[] = [
  { id: "ec_01", enrollmentId: "en_01", curriculumId: "cu_fgb_3", role: "GENERAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_02", enrollmentId: "en_01", curriculumId: "cu_ds_3", role: "TECHNICAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_03", enrollmentId: "en_03", curriculumId: "cu_adm_2", role: "TECHNICAL_EDUCATION", status: "PENDING" },
  { id: "ec_04", enrollmentId: "en_05", curriculumId: "cu_ds_3", role: "TECHNICAL_EDUCATION", status: "PENDING" },
  { id: "ec_05", enrollmentId: "en_06", curriculumId: "cu_fgb_3", role: "GENERAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_06", enrollmentId: "en_07", curriculumId: "cu_ds_3", role: "TECHNICAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_07", enrollmentId: "en_08", curriculumId: "cu_adm_2", role: "TECHNICAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_08", enrollmentId: "en_09", curriculumId: "cu_fgb_3", role: "GENERAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_09", enrollmentId: "en_09", curriculumId: "cu_it_3", role: "ITINERARY", status: "ACTIVE" },
  { id: "ec_10", enrollmentId: "en_10", curriculumId: "cu_fgb_3", role: "GENERAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_11", enrollmentId: "en_10", curriculumId: "cu_ds_3", role: "TECHNICAL_EDUCATION", status: "DROPPED" },
  { id: "ec_12", enrollmentId: "en_12", curriculumId: "cu_fgb_3", role: "GENERAL_EDUCATION", status: "ACTIVE" },
  { id: "ec_13", enrollmentId: "en_13", curriculumId: "cu_fgb_3", role: "GENERAL_EDUCATION", status: "TRANSFERRED" },
];

/* ---------- Consultas ---------- */

export async function listStudents() {
  return students;
}
export async function getStudent(id: string) {
  return students.find((s) => s.id === id) ?? null;
}
export async function listGuardians() {
  return guardians;
}
export async function getGuardian(id: string) {
  return guardians.find((g) => g.id === id) ?? null;
}
export async function listGuardianLinks() {
  return guardianLinks;
}
export async function linksOfStudent(studentId: string) {
  return guardianLinks.filter((l) => l.studentId === studentId);
}
export async function linksOfGuardian(guardianId: string) {
  return guardianLinks.filter((l) => l.guardianId === guardianId);
}
export async function listTeacherProfiles() {
  return teacherProfiles;
}
export async function getTeacherProfile(id: string) {
  return teacherProfiles.find((t) => t.id === id) ?? null;
}
export async function listAssignments() {
  return teacherAssignments;
}
export async function assignmentsOfTeacher(teacherId: string) {
  return teacherAssignments.filter((a) => a.teacherId === teacherId);
}
export async function listEnrollments(
  filters: { academicYearId?: string; classGroupId?: string; status?: string } = {},
) {
  return enrollments.filter(
    (e) =>
      (!filters.academicYearId || e.academicYearId === filters.academicYearId) &&
      (!filters.classGroupId || e.classGroupId === filters.classGroupId) &&
      (!filters.status || e.status === filters.status),
  );
}
export async function getEnrollment(id: string) {
  return enrollments.find((e) => e.id === id) ?? null;
}
export async function enrollmentsOfStudent(studentId: string) {
  return enrollments
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.academicYearId.localeCompare(a.academicYearId));
}
export async function listEnrollmentCurricula() {
  return enrollmentCurricula;
}
export async function curriculaOfEnrollment(enrollmentId: string) {
  return enrollmentCurricula.filter((c) => c.enrollmentId === enrollmentId);
}

/** Opções do filtro "Turma", restritas ao ano letivo quando informado. */
export async function listClassGroupOptions(academicYearId?: string): Promise<Option[]> {
  const yearName = new Map(academicYears.map((y) => [y.id, y.name] as const));
  return classGroups
    .filter((g) => !academicYearId || g.academicYearId === academicYearId)
    .map((g) => ({
      value: g.id,
      label: `${g.name} · ${stageLabel(g.stageId, false)}${academicYearId ? "" : ` (${yearName.get(g.academicYearId)})`}`,
    }));
}
