import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { CurriculumForm } from "@/components/academic/curriculum-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listAcademicYears, listCourses, listStages, stageLabel } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Nova matriz | Gestão Escolar" };

export default async function NewCurriculumPage() {
  await requireRole("SCHOOL_ADMIN");
  const [years, stages, courses] = await Promise.all([listAcademicYears(), listStages(), listCourses()]);

  return (
    <>
      <BackLink href="/admin/estrutura/matrizes">Matrizes curriculares</BackLink>
      <PageHeader title="Nova matriz curricular" />
      <CurriculumForm
        yearOptions={years.map((y) => ({ value: y.id, label: y.name }))}
        stageOptions={stages.map((s) => ({ value: s.id, label: stageLabel(s.id) }))}
        courseOptions={courses.map((c) => ({ value: c.id, label: c.name }))}
      />
    </>
  );
}
