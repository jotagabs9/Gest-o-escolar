/**
 * MOCK: Estrutura Acadêmica (Lote 2).
 * Cadeia do domínio: AcademicYear → EducationModality → EducationStage → Course → Curriculum →
 * CurriculumComponent → ClassGroup. Tudo filtrado pela escola da sessão (RLS cuida do isolamento).
 *
 * TODO (Prisma): trocar cada função `list` e `get` por uma query com a runtime role; os nomes de campo
 * abaixo são os que as telas esperam, então confira o mapeamento com o schema.prisma.
 * Listas de opções (tipos, turnos, áreas) viriam dos enums do Prisma / tabelas de apoio.
 */

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export function optionLabel<T extends string>(options: Option<T>[], value: T | string | null | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

/* ---------- Opções (enums) ---------- */

export type YearStatus = "PLANNED" | "ACTIVE" | "CLOSED";
export const YEAR_STATUS_OPTIONS: Option<YearStatus>[] = [
  { value: "PLANNED", label: "Planejado" },
  { value: "ACTIVE", label: "Em andamento" },
  { value: "CLOSED", label: "Encerrado" },
];

export type ModalityType = "REGULAR" | "INTEGRATED" | "CONCOMITANT" | "SUBSEQUENT" | "EJA" | "OTHER";
export const MODALITY_TYPE_OPTIONS: Option<ModalityType>[] = [
  { value: "REGULAR", label: "Regular" },
  { value: "INTEGRATED", label: "Integrado" },
  { value: "CONCOMITANT", label: "Concomitante" },
  { value: "SUBSEQUENT", label: "Subsequente" },
  { value: "EJA", label: "EJA" },
  { value: "OTHER", label: "Outro" },
];

export type Shift = "MORNING" | "AFTERNOON" | "EVENING" | "FULL_TIME";
export const SHIFT_OPTIONS: Option<Shift>[] = [
  { value: "MORNING", label: "Matutino" },
  { value: "AFTERNOON", label: "Vespertino" },
  { value: "EVENING", label: "Noturno" },
  { value: "FULL_TIME", label: "Integral" },
];

export type CurriculumStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export const CURRICULUM_STATUS_OPTIONS: Option<CurriculumStatus>[] = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "ARCHIVED", label: "Arquivada" },
];

export type ComponentType = "GENERAL" | "ITINERARY" | "LIFE_PROJECT" | "TECHNICAL" | "ELECTIVE" | "OTHER";
export const COMPONENT_TYPE_OPTIONS: Option<ComponentType>[] = [
  { value: "GENERAL", label: "Formação Geral" },
  { value: "ITINERARY", label: "Itinerário" },
  { value: "LIFE_PROJECT", label: "Projeto de Vida" },
  { value: "TECHNICAL", label: "Formação Técnica" },
  { value: "ELECTIVE", label: "Eletiva" },
  { value: "OTHER", label: "Outro" },
];

export const KNOWLEDGE_AREA_OPTIONS: Option[] = [
  { value: "LANGUAGES", label: "Linguagens e suas Tecnologias" },
  { value: "MATH", label: "Matemática e suas Tecnologias" },
  { value: "NATURE", label: "Ciências da Natureza e suas Tecnologias" },
  { value: "HUMANITIES", label: "Ciências Humanas e Sociais Aplicadas" },
  { value: "TECHNICAL", label: "Formação Técnica e Profissional" },
  { value: "TRANSVERSAL", label: "Transversal" },
];

/* ---------- Entidades ---------- */

export interface AcademicYear {
  id: string;
  name: string;
  startsAt: string; // ISO yyyy-mm-dd
  endsAt: string;
  status: YearStatus;
}

export interface Modality {
  id: string;
  name: string;
  type: ModalityType;
  description?: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  modalityId: string;
}

export interface Course {
  id: string;
  name: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  shift: Shift;
  stageId: string;
  academicYearId: string;
  curriculumId: string | null;
  capacity: number;
  enrolled: number;
}

export interface Curriculum {
  id: string;
  name: string;
  code: string;
  academicYearId: string;
  stageId: string;
  courseId: string | null;
  status: CurriculumStatus;
  description?: string;
}

export interface CurriculumComponent {
  id: string;
  curriculumId: string;
  name: string;
  workloadHours: number;
  type: ComponentType;
  knowledgeArea: string;
  teacherId: string | null;
}

export interface Teacher {
  id: string;
  name: string;
}

/* ---------- Dados ---------- */

export const academicYears: AcademicYear[] = [
  { id: "ay_2027", name: "2027", startsAt: "2027-02-01", endsAt: "2027-12-17", status: "PLANNED" },
  { id: "ay_2026", name: "2026", startsAt: "2026-02-02", endsAt: "2026-12-18", status: "ACTIVE" },
  { id: "ay_2025", name: "2025", startsAt: "2025-02-03", endsAt: "2025-12-19", status: "CLOSED" },
  { id: "ay_2024", name: "2024", startsAt: "2024-02-05", endsAt: "2024-12-20", status: "CLOSED" },
];

export const modalities: Modality[] = [
  { id: "md_regular", name: "Ensino Médio Regular", type: "REGULAR", description: "Formação Geral Básica e itinerários formativos." },
  { id: "md_integrado", name: "Ensino Médio Integrado à Educação Profissional", type: "INTEGRATED", description: "Ensino médio e formação técnica na mesma matrícula." },
  { id: "md_concomitante", name: "Educação Profissional Concomitante", type: "CONCOMITANT", description: "Curso técnico em turno distinto do ensino médio." },
  { id: "md_eja", name: "Educação de Jovens e Adultos", type: "EJA" },
];

export const stages: Stage[] = [
  { id: "st_r1", name: "1ª série", order: 1, modalityId: "md_regular" },
  { id: "st_r2", name: "2ª série", order: 2, modalityId: "md_regular" },
  { id: "st_r3", name: "3ª série", order: 3, modalityId: "md_regular" },
  { id: "st_i1", name: "1ª série", order: 1, modalityId: "md_integrado" },
  { id: "st_i2", name: "2ª série", order: 2, modalityId: "md_integrado" },
  { id: "st_i3", name: "3ª série", order: 3, modalityId: "md_integrado" },
  { id: "st_c1", name: "Módulo I", order: 1, modalityId: "md_concomitante" },
  { id: "st_c2", name: "Módulo II", order: 2, modalityId: "md_concomitante" },
  { id: "st_e1", name: "1ª etapa", order: 1, modalityId: "md_eja" },
  { id: "st_e2", name: "2ª etapa", order: 2, modalityId: "md_eja" },
];

export const courses: Course[] = [
  { id: "co_ds", name: "Técnico em Desenvolvimento de Sistemas" },
  { id: "co_adm", name: "Técnico em Administração" },
];

export const teachers: Teacher[] = [
  { id: "t1", name: "Helena Duarte" },
  { id: "t2", name: "Ricardo Alves" },
  { id: "t3", name: "Camila Torres" },
  { id: "t4", name: "Daniela Pires" },
  { id: "t5", name: "Sérgio Matos" },
  { id: "t6", name: "Rafael Nogueira" },
  { id: "t7", name: "Patrícia Lemos" },
];

export const curricula: Curriculum[] = [
  { id: "cu_fgb_3", name: "Formação Geral Básica: 3ª série", code: "FGB-EM-3", academicYearId: "ay_2026", stageId: "st_r3", courseId: null, status: "ACTIVE", description: "Componentes obrigatórios da 3ª série do Ensino Médio regular." },
  { id: "cu_it_3", name: "Itinerário Linguagens: 3ª série", code: "IT-LING-3", academicYearId: "ay_2026", stageId: "st_r3", courseId: null, status: "ACTIVE" },
  { id: "cu_ds_3", name: "Técnico em Desenvolvimento de Sistemas: 3ª série", code: "TEC-DS-3", academicYearId: "ay_2026", stageId: "st_i3", courseId: "co_ds", status: "ACTIVE", description: "Formação técnica integrada ao Ensino Médio." },
  { id: "cu_adm_2", name: "Técnico em Administração: 2ª série", code: "TEC-ADM-2", academicYearId: "ay_2026", stageId: "st_i2", courseId: "co_adm", status: "ACTIVE" },
  { id: "cu_fgb_1_27", name: "Formação Geral Básica: 1ª série", code: "FGB-EM-1", academicYearId: "ay_2027", stageId: "st_r1", courseId: null, status: "DRAFT" },
];

export const curriculumComponents: CurriculumComponent[] = [
  // FGB 3ª série
  { id: "cc_01", curriculumId: "cu_fgb_3", name: "Língua Portuguesa", workloadHours: 240, type: "GENERAL", knowledgeArea: "LANGUAGES", teacherId: "t1" },
  { id: "cc_02", curriculumId: "cu_fgb_3", name: "Matemática", workloadHours: 240, type: "GENERAL", knowledgeArea: "MATH", teacherId: "t2" },
  { id: "cc_03", curriculumId: "cu_fgb_3", name: "Física", workloadHours: 120, type: "GENERAL", knowledgeArea: "NATURE", teacherId: "t3" },
  { id: "cc_04", curriculumId: "cu_fgb_3", name: "Biologia", workloadHours: 120, type: "GENERAL", knowledgeArea: "NATURE", teacherId: "t4" },
  { id: "cc_05", curriculumId: "cu_fgb_3", name: "Química", workloadHours: 80, type: "GENERAL", knowledgeArea: "NATURE", teacherId: null },
  { id: "cc_06", curriculumId: "cu_fgb_3", name: "História", workloadHours: 80, type: "GENERAL", knowledgeArea: "HUMANITIES", teacherId: null },
  { id: "cc_07", curriculumId: "cu_fgb_3", name: "Projeto de Vida", workloadHours: 40, type: "LIFE_PROJECT", knowledgeArea: "TRANSVERSAL", teacherId: "t5" },
  // Itinerário Linguagens
  { id: "cc_08", curriculumId: "cu_it_3", name: "Oficina de Redação", workloadHours: 80, type: "ITINERARY", knowledgeArea: "LANGUAGES", teacherId: "t1" },
  { id: "cc_09", curriculumId: "cu_it_3", name: "Cultura e Mídias Digitais", workloadHours: 60, type: "ITINERARY", knowledgeArea: "LANGUAGES", teacherId: null },
  { id: "cc_10", curriculumId: "cu_it_3", name: "Inglês Instrumental", workloadHours: 40, type: "ELECTIVE", knowledgeArea: "LANGUAGES", teacherId: null },
  // Técnico DS
  { id: "cc_11", curriculumId: "cu_ds_3", name: "Banco de Dados", workloadHours: 160, type: "TECHNICAL", knowledgeArea: "TECHNICAL", teacherId: "t6" },
  { id: "cc_12", curriculumId: "cu_ds_3", name: "Programação de Aplicativos", workloadHours: 200, type: "TECHNICAL", knowledgeArea: "TECHNICAL", teacherId: "t6" },
  { id: "cc_13", curriculumId: "cu_ds_3", name: "Modelagem de Sistemas I", workloadHours: 80, type: "TECHNICAL", knowledgeArea: "TECHNICAL", teacherId: null },
  { id: "cc_14", curriculumId: "cu_ds_3", name: "Fundamentos de Redes de Computadores", workloadHours: 80, type: "TECHNICAL", knowledgeArea: "TECHNICAL", teacherId: null },
  // Técnico Administração
  { id: "cc_15", curriculumId: "cu_adm_2", name: "Introdução à Administração", workloadHours: 80, type: "TECHNICAL", knowledgeArea: "TECHNICAL", teacherId: "t7" },
  { id: "cc_16", curriculumId: "cu_adm_2", name: "Contabilidade Básica", workloadHours: 120, type: "TECHNICAL", knowledgeArea: "TECHNICAL", teacherId: null },
  // Rascunho 2027
  { id: "cc_17", curriculumId: "cu_fgb_1_27", name: "Língua Portuguesa", workloadHours: 240, type: "GENERAL", knowledgeArea: "LANGUAGES", teacherId: null },
  { id: "cc_18", curriculumId: "cu_fgb_1_27", name: "Matemática", workloadHours: 240, type: "GENERAL", knowledgeArea: "MATH", teacherId: null },
];

export const classGroups: ClassGroup[] = [
  { id: "cg_01", name: "1º A", shift: "MORNING", stageId: "st_r1", academicYearId: "ay_2026", curriculumId: null, capacity: 40, enrolled: 38 },
  { id: "cg_02", name: "1º B", shift: "AFTERNOON", stageId: "st_r1", academicYearId: "ay_2026", curriculumId: null, capacity: 40, enrolled: 40 },
  { id: "cg_03", name: "2º A", shift: "MORNING", stageId: "st_r2", academicYearId: "ay_2026", curriculumId: null, capacity: 40, enrolled: 35 },
  { id: "cg_04", name: "3º C", shift: "MORNING", stageId: "st_r3", academicYearId: "ay_2026", curriculumId: "cu_fgb_3", capacity: 40, enrolled: 36 },
  { id: "cg_05", name: "3º D", shift: "AFTERNOON", stageId: "st_r3", academicYearId: "ay_2026", curriculumId: "cu_fgb_3", capacity: 40, enrolled: 31 },
  { id: "cg_06", name: "1º D", shift: "FULL_TIME", stageId: "st_i1", academicYearId: "ay_2026", curriculumId: null, capacity: 36, enrolled: 29 },
  { id: "cg_07", name: "2º B", shift: "FULL_TIME", stageId: "st_i2", academicYearId: "ay_2026", curriculumId: "cu_adm_2", capacity: 36, enrolled: 31 },
  { id: "cg_08", name: "3º A", shift: "FULL_TIME", stageId: "st_i3", academicYearId: "ay_2026", curriculumId: "cu_ds_3", capacity: 36, enrolled: 34 },
  { id: "cg_09", name: "EJA 1A", shift: "EVENING", stageId: "st_e1", academicYearId: "ay_2026", curriculumId: null, capacity: 45, enrolled: 28 },
  { id: "cg_10", name: "Módulo I A", shift: "EVENING", stageId: "st_c1", academicYearId: "ay_2026", curriculumId: null, capacity: 30, enrolled: 22 },
  { id: "cg_11", name: "3º A", shift: "FULL_TIME", stageId: "st_i3", academicYearId: "ay_2025", curriculumId: null, capacity: 36, enrolled: 33 },
];

/* ---------- Consultas (simulam o acesso a dados) ---------- */

export async function listAcademicYears() {
  return academicYears;
}
export async function getAcademicYear(id: string) {
  return academicYears.find((y) => y.id === id) ?? null;
}
export async function listModalities() {
  return modalities;
}
export async function getModality(id: string) {
  return modalities.find((m) => m.id === id) ?? null;
}
export async function listStages() {
  return [...stages].sort(
    (a, b) =>
      modalities.findIndex((m) => m.id === a.modalityId) - modalities.findIndex((m) => m.id === b.modalityId) ||
      a.order - b.order,
  );
}
export async function getStage(id: string) {
  return stages.find((s) => s.id === id) ?? null;
}
export async function listCourses() {
  return courses;
}
export async function listTeachers() {
  return teachers;
}
export async function listClassGroups(filters: { academicYearId?: string; stageId?: string } = {}) {
  return classGroups.filter(
    (g) =>
      (!filters.academicYearId || g.academicYearId === filters.academicYearId) &&
      (!filters.stageId || g.stageId === filters.stageId),
  );
}
export async function getClassGroup(id: string) {
  return classGroups.find((g) => g.id === id) ?? null;
}
export async function listCurricula() {
  return curricula;
}
export async function getCurriculum(id: string) {
  return curricula.find((c) => c.id === id) ?? null;
}
export async function listComponents(curriculumId: string) {
  return curriculumComponents.filter((c) => c.curriculumId === curriculumId);
}
export async function listAllComponents() {
  return curriculumComponents;
}
export async function getComponent(id: string) {
  return curriculumComponents.find((c) => c.id === id) ?? null;
}

/* ---------- Lookups para exibição ---------- */

export const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map((i) => [i.id, i] as const));

/** "Ensino Médio Regular · 3ª série" */
export function stageLabel(stageId: string, withModality = true): string {
  const stage = stages.find((s) => s.id === stageId);
  if (!stage) return "—";
  const modality = modalities.find((m) => m.id === stage.modalityId);
  return withModality && modality ? `${modality.name} · ${stage.name}` : stage.name;
}
