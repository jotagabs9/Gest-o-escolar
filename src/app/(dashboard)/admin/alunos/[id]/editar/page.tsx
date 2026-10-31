import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StudentForm } from "@/components/people/student-form";
import { getStudent, linksOfStudent, listGuardians } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar aluno | Gestão Escolar" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const [student, links, guardians] = await Promise.all([getStudent(id), linksOfStudent(id), listGuardians()]);
  if (!student) notFound();

  return (
    <>
      <BackLink href={`/admin/alunos/${id}`}>{student.name}</BackLink>
      <PageHeader title="Editar aluno" description={`Nº ${student.registrationNumber}`} />
      <StudentForm
        initial={student}
        initialLinks={links.map((l) => ({ guardianId: l.guardianId, relationship: l.relationship, isPrimary: l.isPrimary }))}
        guardianOptions={guardians.map((g) => ({ value: g.id, label: g.name }))}
      />
    </>
  );
}
