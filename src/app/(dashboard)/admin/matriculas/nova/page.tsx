import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EnrollmentForm } from "@/components/people/enrollment-form";
import { listAcademicYears, listClassGroups, listCurricula, stageLabel } from "@/lib/mock/academic";
import {
  ENROLLMENT_ROLE_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
  SUGGESTED_ROLE_BY_CURRICULUM,
  listEnrollments,
  listStudents,
} from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Nova matrícula | Gestão Escolar" };

export default async function NewEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ aluno?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { aluno } = await searchParams;

  const [students, years, groups, curricula, enrollments] = await Promise.all([
    listStudents(),
    listAcademicYears(),
    listClassGroups(),
    listCurricula(),
    listEnrollments(),
  ]);

  const activeStudents = students.filter((s) => s.status === "ACTIVE");
  const activeYear = years.find((y) => y.status === "ACTIVE") ?? years[0];
  // Matrículas só para anos em andamento ou planejados (rematrícula).
  const openYears = years.filter((y) => y.status !== "CLOSED");

  return (
    <>
      <BackLink href="/admin/matriculas">Matrículas</BackLink>
      <PageHeader title="Nova matrícula" description="Escolha o aluno, a turma e as matrizes curriculares que ele vai cursar." />
      <EnrollmentForm
        studentOptions={activeStudents.map((s) => ({ value: s.id, label: `${s.name} · ${s.registrationNumber}` }))}
        yearOptions={openYears.map((y) => ({ value: y.id, label: y.name }))}
        classGroups={groups.map((g) => ({
          id: g.id,
          label: `${g.name} · ${stageLabel(g.stageId, false)}`,
          academicYearId: g.academicYearId,
          curriculumId: g.curriculumId,
          enrolled: g.enrolled,
          capacity: g.capacity,
        }))}
        curricula={curricula
          .filter((c) => c.status !== "ARCHIVED")
          .map((c) => ({ id: c.id, label: `${c.code}: ${c.name}`, academicYearId: c.academicYearId }))}
        suggestedRoles={SUGGESTED_ROLE_BY_CURRICULUM}
        roleOptions={ENROLLMENT_ROLE_OPTIONS}
        statusOptions={ENROLLMENT_STATUS_OPTIONS.filter((o) => o.value === "PENDING" || o.value === "ACTIVE")}
        existing={enrollments.map((e) => ({ id: e.id, number: e.number, studentId: e.studentId, academicYearId: e.academicYearId, status: e.status }))}
        defaultStudentId={activeStudents.some((s) => s.id === aluno) ? aluno : undefined}
        defaultYearId={activeYear.id}
      />
    </>
  );
}
