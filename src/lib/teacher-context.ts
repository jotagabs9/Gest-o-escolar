import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { mockTeacherIdForUser } from "@/lib/mock/assessment";
import { teacherProfiles, type TeacherProfile } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";
import type { SessionUser } from "@/types/auth";

export const DEMO_TEACHER_COOKIE = "demo-teacher";

/**
 * Qual professor (domínio) está logado.
 * Mock: usuário `usr_teacher` → `t6`. Fora de produção, o cookie `demo-teacher` permite trocar de professor
 * para testar outras alocações. Em produção, o professor vem sempre da sessão (NextAuth).
 */
export async function requireTeacher(): Promise<{ user: SessionUser; teacherId: string; teacher: TeacherProfile }> {
  const user = await requireRole("TEACHER");
  let teacherId = mockTeacherIdForUser(user.email);

  if (process.env.NODE_ENV !== "production") {
    const override = (await cookies()).get(DEMO_TEACHER_COOKIE)?.value;
    if (override && teacherProfiles.some((t) => t.id === override)) teacherId = override;
  }

  const teacher = teacherProfiles.find((t) => t.id === teacherId);
  if (!teacherId || !teacher) notFound();
  return { user, teacherId, teacher };
}
