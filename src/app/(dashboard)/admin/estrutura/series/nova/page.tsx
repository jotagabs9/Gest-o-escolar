import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { StageForm } from "@/components/academic/stage-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { listModalities } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Nova série / etapa | Gestão Escolar" };

export default async function NewStagePage() {
  await requireRole("SCHOOL_ADMIN");
  const modalities = await listModalities();
  return (
    <>
      <BackLink href="/admin/estrutura/series">Séries e etapas</BackLink>
      <PageHeader title="Nova série / etapa" />
      <StageForm modalityOptions={modalities.map((m) => ({ value: m.id, label: m.name }))} />
    </>
  );
}
