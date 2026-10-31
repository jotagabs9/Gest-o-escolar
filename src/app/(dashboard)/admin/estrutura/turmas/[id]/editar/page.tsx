import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { ClassGroupForm } from "@/components/academic/class-group-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getClassGroup, listAcademicYears, listCurricula, listStages, stageLabel } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar turma | Gestão Escolar" };

export default async function EditClassGroupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const [group, years, stages, curricula] = await Promise.all([
    getClassGroup(id),
    listAcademicYears(),
    listStages(),
    listCurricula(),
  ]);
  if (!group) notFound();

  return (
    <>
      <BackLink href="/admin/estrutura/turmas">Turmas</BackLink>
      <PageHeader title={`Editar turma ${group.name}`} description={stageLabel(group.stageId)} />
      <ClassGroupForm
        initial={group}
        yearOptions={years.map((y) => ({ value: y.id, label: y.name }))}
        stageOptions={stages.map((s) => ({ value: s.id, label: stageLabel(s.id) }))}
        curriculumOptions={curricula.map((c) => ({ value: c.id, label: `${c.code}: ${c.name}` }))}
      />
    </>
  );
}
