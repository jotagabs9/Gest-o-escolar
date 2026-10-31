import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { CurriculumForm } from "@/components/academic/curriculum-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurriculum, listAcademicYears, listCourses, listStages, stageLabel } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar matriz | Gestão Escolar" };

export default async function EditCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const [curriculum, years, stages, courses] = await Promise.all([
    getCurriculum(id),
    listAcademicYears(),
    listStages(),
    listCourses(),
  ]);
  if (!curriculum) notFound();

  return (
    <>
      <BackLink href={`/admin/estrutura/matrizes/${curriculum.id}`}>{curriculum.name}</BackLink>
      <PageHeader title="Editar matriz curricular" description={curriculum.code} />
      <CurriculumForm
        initial={curriculum}
        yearOptions={years.map((y) => ({ value: y.id, label: y.name }))}
        stageOptions={stages.map((s) => ({ value: s.id, label: stageLabel(s.id) }))}
        courseOptions={courses.map((c) => ({ value: c.id, label: c.name }))}
      />
    </>
  );
}
