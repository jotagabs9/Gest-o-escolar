"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/session";
import { withSession } from "@/server/db/tenant";

const saveSchema = z.object({
  teacherId: z.string().min(1).max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});

export async function saveTeacherAttendance(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira os dados do registro." };

  try {
    await requireRole("SCHOOL_ADMIN");
    await withSession(async (tx, session) => {
      const [teacher] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM public.teachers
        WHERE id = ${parsed.data.teacherId}
          AND school_id = ${session.schoolId}
          AND is_active = true
        LIMIT 1
      `;
      if (!teacher) throw new Error("Professor não encontrado nesta escola.");

      await tx.$executeRaw`
        INSERT INTO public.teacher_attendance_records
          (school_id, teacher_id, attendance_date, status, check_in_time, note, recorded_by_user_id)
        VALUES (
          ${session.schoolId},
          ${teacher.id},
          ${parsed.data.date}::date,
          ${parsed.data.status},
          ${parsed.data.time || null}::time,
          ${parsed.data.note?.trim() || null},
          ${session.id}
        )
        ON CONFLICT (school_id, teacher_id, attendance_date)
        DO UPDATE SET
          status = EXCLUDED.status,
          check_in_time = EXCLUDED.check_in_time,
          note = EXCLUDED.note,
          recorded_by_user_id = EXCLUDED.recorded_by_user_id,
          updated_at = now()
      `;
    });
    revalidatePath("/admin/frequencia-professores");
    revalidatePath("/professor/minha-frequencia");
    return { ok: true };
  } catch (error) {
    console.error("[teacher-attendance] erro ao salvar", error);
    return { ok: false, error: error instanceof Error ? error.message : "Não foi possível salvar o registro." };
  }
}
