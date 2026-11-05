"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/session";
import { withSession } from "@/server/db/tenant";

const createStudentSchema = z.object({
  name: z.string().trim().min(3).max(180),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classGroupId: z.string().min(1).max(64),
});

export async function createStudentWithEnrollment(input: unknown): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira o nome, a data de nascimento e a turma." };

  try {
    await requireRole("SCHOOL_ADMIN");
    await withSession(async (tx, session) => {
      const [classGroup] = await tx.$queryRaw<{
        id: string;
        academic_year_id: string;
        curriculum_id: string;
        course_type: string | null;
      }[]> `
        SELECT
          cg.id,
          cg.academic_year_id,
          cg.curriculum_id,
          co.course_type::text AS course_type
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
        WHERE cg.id = ${parsed.data.classGroupId}
          AND cg.school_id = ${session.schoolId}
          AND cg.is_active = true
          AND ay.is_active = true
          AND cur.status = 'ACTIVE'
        LIMIT 1
      `;
      if (!classGroup) throw new Error("A turma selecionada não está ativa ou não pertence à sua escola.");

      const roleCode = classGroup.course_type === "TECHNICAL"
        ? "TECHNICAL_EDUCATION"
        : "GENERAL_EDUCATION";

      const [role] = await tx.$queryRaw<{ id: string }[]> `
        SELECT id
        FROM public.enrollment_curriculum_roles
        WHERE code = ${roleCode}
          AND is_active = true
        LIMIT 1
      `;
      if (!role) throw new Error("O papel curricular necessário não está configurado. Aplique a atualização do banco e tente novamente.");

      const [student] = await tx.$queryRaw<{ id: string }[]> `
        INSERT INTO public.students (school_id, full_name, birth_date)
        VALUES (
          ${session.schoolId},
          ${parsed.data.name},
          ${parsed.data.birthDate}::date::timestamptz
        )
        RETURNING id
      `;

      const [enrollment] = await tx.$queryRaw<{ id: string }[]> `
        INSERT INTO public.enrollments (
          student_id,
          school_id,
          academic_year_id,
          class_group_id,
          status,
          start_date
        )
        VALUES (
          ${student.id},
          ${session.schoolId},
          ${classGroup.academic_year_id},
          ${classGroup.id},
          'ACTIVE',
          now()
        )
        RETURNING id
      `;

      await tx.$executeRaw`
        INSERT INTO public.enrollment_curricula (
          enrollment_id,
          curriculum_id,
          role_id,
          status,
          start_date
        )
        VALUES (
          ${enrollment.id},
          ${classGroup.curriculum_id},
          ${role.id},
          'ACTIVE',
          now()
        )
      `;
    });

    revalidatePath("/admin/alunos");
    revalidatePath("/admin/matriculas");
    return { ok: true };
  } catch (error) {
    console.error("[student-create] erro ao cadastrar aluno e matrícula", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível cadastrar o aluno.",
    };
  }
}
