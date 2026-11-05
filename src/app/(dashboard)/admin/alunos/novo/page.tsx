import type { Metadata } from "next";

import { BackLink } from "@/components/academic/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { StudentForm } from "@/components/people/student-form";
import { requireRole } from "@/lib/session";
import { withSession } from "@/server/db/tenant";

export const metadata: Metadata = { title: "Novo aluno | Gestão Escolar" };

export default async function NewStudentPage() {
  await requireRole("SCHOOL_ADMIN");

  const classOptions = await withSession(async (tx, session) => {
    const rows = await tx.$queryRaw<{
      id: string;
      name: string;
      academic_year: number;
      course_name: string | null;
    }[]> `
      SELECT
        cg.id,
        cg.name,
        ay.year AS academic_year,
        co.name AS course_name
      FROM public.class_groups cg
      JOIN public.academic_years ay
        ON ay.id = cg.academic_year_id
       AND ay.school_id = cg.school_id
      JOIN public.curricula cur
        ON cur.id = cg.curriculum_id
       AND cur.school_id = cg.school_id
      LEFT JOIN public.courses co
        ON co.id = cur.course_id
       AND co.school_id = cg.school_id
      WHERE cg.school_id = \${session.schoolId}
        AND cg.is_active = true
        AND ay.is_active = true
        AND cur.status = 'ACTIVE'
      ORDER BY ay.year DESC, cg.name
    `;

    return rows.map((row) => ({
      value: row.id,
      label: `\${row.name} · \${row.academic_year}\${row.course_name ? \` · \${row.course_name}\` : ""}`,
    }));
  });

  return (
    <>
      <BackLink href="/admin/alunos">Alunos</BackLink>
      <PageHeader title="Novo aluno" description="Cadastre o aluno e já faça sua matrícula em uma turma ativa." />
      <StudentForm classOptions={classOptions} />
    </>
  );
}
