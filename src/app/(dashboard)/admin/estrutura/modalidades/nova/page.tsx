import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { ModalityForm } from "@/components/academic/modality-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Nova modalidade | Gestão Escolar" };

export default async function NewModalityPage() {
  await requireRole("SCHOOL_ADMIN");
  return (
    <>
      <BackLink href="/admin/estrutura/modalidades">Modalidades</BackLink>
      <PageHeader title="Nova modalidade" />
      <ModalityForm />
    </>
  );
}
