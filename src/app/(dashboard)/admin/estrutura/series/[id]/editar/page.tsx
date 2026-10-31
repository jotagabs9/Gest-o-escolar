import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { StageForm } from "@/components/academic/stage-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getStage, listModalities } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar série / etapa | Gestão Escolar" };

export default async function EditStagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const [stage, modalities] = await Promise.all([getStage(id), listModalities()]);
  if (!stage) notFound();

  return (
    <>
      <BackLink href="/admin/estrutura/series">Séries e etapas</BackLink>
      <PageHeader title="Editar série / etapa" description={stage.name} />
      <StageForm initial={stage} modalityOptions={modalities.map((m) => ({ value: m.id, label: m.name }))} />
    </>
  );
}
