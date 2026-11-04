import type { Metadata } from "next";

import { TeacherAttendancePanel } from "@/components/people/teacher-attendance-panel";
import { listTeacherProfiles } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Frequência dos professores | Gestão Escolar" };

export default async function TeacherAttendanceAdminPage() {
  await requireRole("SCHOOL_ADMIN");
  const teachers = await listTeacherProfiles();

  return <TeacherAttendancePanel teachers={teachers} />;
}
