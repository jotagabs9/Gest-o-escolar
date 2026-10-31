import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { ModalityForm } from "@/components/academic/modality-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getModality } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar modalidade | Gestão Escolar" };

export default async function EditModalityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const modality = await getModality(id);
  if (!modality) notFound();

  return (
    <>
      <BackLink href="/admin/estrutura/modalidades">Modalidades</BackLink>
      <PageHeader title="Editar modalidade" description={modality.name} />
      <ModalityForm initial={modality} />
    </>
  );
}
