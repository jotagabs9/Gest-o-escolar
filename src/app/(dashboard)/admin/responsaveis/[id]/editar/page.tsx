import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { GuardianForm } from "@/components/people/guardian-form";
import { getGuardian, linksOfGuardian, listStudents } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar responsável | Gestão Escolar" };

export default async function EditGuardianPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const [guardian, links, students] = await Promise.all([getGuardian(id), linksOfGuardian(id), listStudents()]);
  if (!guardian) notFound();

  return (
    <>
      <BackLink href="/admin/responsaveis">Responsáveis</BackLink>
      <PageHeader title="Editar responsável" description={guardian.name} />
      <GuardianForm
        initial={guardian}
        initialLinks={links.map((l) => ({ studentId: l.studentId, relationship: l.relationship, isPrimary: l.isPrimary }))}
        studentOptions={students.map((s) => ({ value: s.id, label: `${s.name} · ${s.registrationNumber}` }))}
      />
    </>
  );
}
