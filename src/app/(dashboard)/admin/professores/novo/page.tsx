import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { TeacherForm } from "@/components/people/teacher-form";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Novo professor | Gestão Escolar" };

export default async function NewTeacherPage() {
  await requireRole("SCHOOL_ADMIN");
  return (
    <>
      <BackLink href="/admin/professores">Professores</BackLink>
      <PageHeader title="Novo professor" />
      <TeacherForm />
    </>
  );
}
