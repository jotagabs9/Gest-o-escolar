import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcademicYearForm } from "@/components/academic/academic-year-form";
import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAcademicYear } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar ano letivo | Gestão Escolar" };

export default async function EditAcademicYearPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const year = await getAcademicYear(id);
  if (!year) notFound();

  return (
    <>
      <BackLink href="/admin/estrutura/anos-letivos">Anos letivos</BackLink>
      <PageHeader title={`Editar ano letivo ${year.name}`} />
      <AcademicYearForm initial={year} />
    </>
  );
}
