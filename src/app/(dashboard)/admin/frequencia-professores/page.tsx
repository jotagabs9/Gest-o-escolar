import type { Metadata } from "next";

import { TeacherAttendancePanel, type TeacherAttendanceItem } from "@/components/people/teacher-attendance-panel";
import { requireRole } from "@/lib/session";
import { withSession } from "@/server/db/tenant";

export const metadata: Metadata = { title: "Frequência dos professores | Gestão Escolar" };

export default async function TeacherAttendanceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { data } = await searchParams;
  const date = data && /^\d{4}-\d{2}-\d{2}$/.test(data)
    ? data
    : new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

  const teachers = await withSession(async (tx, session) => tx.$queryRaw<TeacherAttendanceItem[]>`
    SELECT
      t.id AS "teacherId",
      t.full_name AS name,
      ''::text AS email,
      ''::text AS specialty,
      CASE WHEN a.check_in_time IS NULL THEN '' ELSE to_char(a.check_in_time, 'HH24:MI') END AS time,
      COALESCE(a.status, 'PENDING') AS status,
      COALESCE(a.note, '') AS note
    FROM public.teachers t
    LEFT JOIN public.teacher_attendance_records a
      ON a.teacher_id = t.id
      AND a.school_id = t.school_id
      AND a.attendance_date = ${date}::date
    WHERE t.school_id = ${session.schoolId}
      AND t.is_active = true
    ORDER BY t.full_name
  `);

  return <TeacherAttendancePanel initialTeachers={teachers} date={date} />;
}
