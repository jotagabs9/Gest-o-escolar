import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StudentForm } from "@/components/people/student-form";
import { listGuardians } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Novo aluno | Gestão Escolar" };

export default async function NewStudentPage() {
  await requireRole("SCHOOL_ADMIN");
  const guardians = await listGuardians();
  return (
    <>
      <BackLink href="/admin/alunos">Alunos</BackLink>
      <PageHeader title="Novo aluno" description="Depois de cadastrar, crie a matrícula do aluno no ano letivo." />
      <StudentForm guardianOptions={guardians.map((g) => ({ value: g.id, label: g.name }))} />
    </>
  );
}
