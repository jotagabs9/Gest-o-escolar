import type { Metadata } from "next";

import { AcademicYearForm } from "@/components/academic/academic-year-form";
import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Novo ano letivo | Gestão Escolar" };

export default async function NewAcademicYearPage() {
  await requireRole("SCHOOL_ADMIN");
  return (
    <>
      <BackLink href="/admin/estrutura/anos-letivos">Anos letivos</BackLink>
      <PageHeader title="Novo ano letivo" />
      <AcademicYearForm />
    </>
  );
}
