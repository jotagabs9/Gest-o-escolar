import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { CurriculumComponentForm } from "@/components/academic/curriculum-component-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getComponent, getCurriculum, listTeachers } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar componente | Gestão Escolar" };

export default async function EditComponentPage({
  params,
}: {
  params: Promise<{ id: string; componentId: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { id, componentId } = await params;
  const [curriculum, component, teachers] = await Promise.all([
    getCurriculum(id),
    getComponent(componentId),
    listTeachers(),
  ]);
  if (!curriculum || !component || component.curriculumId !== id) notFound();

  return (
    <>
      <BackLink href={`/admin/estrutura/matrizes/${id}`}>{curriculum.name}</BackLink>
      <PageHeader title={`Editar ${component.name}`} description={curriculum.name} />
      <CurriculumComponentForm
        curriculumId={id}
        initial={component}
        teacherOptions={teachers.map((t) => ({ value: t.id, label: t.name }))}
      />
    </>
  );
}
