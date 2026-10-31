import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { GuardianForm } from "@/components/people/guardian-form";
import { listStudents } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Novo responsável | Gestão Escolar" };

export default async function NewGuardianPage() {
  await requireRole("SCHOOL_ADMIN");
  const students = await listStudents();
  return (
    <>
      <BackLink href="/admin/responsaveis">Responsáveis</BackLink>
      <PageHeader title="Novo responsável" />
      <GuardianForm studentOptions={students.map((s) => ({ value: s.id, label: `${s.name} · ${s.registrationNumber}` }))} />
    </>
  );
}
