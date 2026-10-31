import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { ClassGroupForm } from "@/components/academic/class-group-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listAcademicYears, listCurricula, listStages, stageLabel } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Nova turma | Gestão Escolar" };

export default async function NewClassGroupPage() {
  await requireRole("SCHOOL_ADMIN");
  const [years, stages, curricula] = await Promise.all([listAcademicYears(), listStages(), listCurricula()]);

  return (
    <>
      <BackLink href="/admin/estrutura/turmas">Turmas</BackLink>
      <PageHeader title="Nova turma" />
      <ClassGroupForm
        yearOptions={years.map((y) => ({ value: y.id, label: y.name }))}
        stageOptions={stages.map((s) => ({ value: s.id, label: stageLabel(s.id) }))}
        curriculumOptions={curricula.map((c) => ({ value: c.id, label: `${c.code}: ${c.name}` }))}
      />
    </>
  );
}
