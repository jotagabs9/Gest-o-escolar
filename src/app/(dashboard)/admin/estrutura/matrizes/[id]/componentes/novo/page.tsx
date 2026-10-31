import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { CurriculumComponentForm } from "@/components/academic/curriculum-component-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurriculum, listTeachers } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Novo componente | Gestão Escolar" };

export default async function NewComponentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const [curriculum, teachers] = await Promise.all([getCurriculum(id), listTeachers()]);
  if (!curriculum) notFound();

  return (
    <>
      <BackLink href={`/admin/estrutura/matrizes/${id}`}>{curriculum.name}</BackLink>
      <PageHeader title="Novo componente curricular" description={curriculum.name} />
      <CurriculumComponentForm
        curriculumId={id}
        teacherOptions={teachers.map((t) => ({ value: t.id, label: t.name }))}
      />
    </>
  );
}
