import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { TeacherForm } from "@/components/people/teacher-form";
import { getTeacherProfile } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Editar professor | Gestão Escolar" };

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const teacher = await getTeacherProfile(id);
  if (!teacher) notFound();

  return (
    <>
      <BackLink href={`/admin/professores/${id}`}>{teacher.name}</BackLink>
      <PageHeader title="Editar professor" description={teacher.email} />
      <TeacherForm initial={teacher} />
    </>
  );
}
