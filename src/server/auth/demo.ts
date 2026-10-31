import type { Role } from "@/types/auth";

/** Acesso de demonstração: só em desenvolvimento e só com ENABLE_DEMO_LOGIN=true. Nunca em produção. */
export function demoEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_LOGIN === "true";
}

export function demoEmail(role: Role): string | undefined {
  const map: Record<Role, string | undefined> = {
    SCHOOL_ADMIN: process.env.DEMO_ADMIN_EMAIL,
    TEACHER: process.env.DEMO_TEACHER_EMAIL,
    STUDENT_GUARDIAN: process.env.DEMO_GUARDIAN_EMAIL,
  };
  return map[role];
}

export function demoAccounts(): { role: Role; email: string }[] {
  if (!demoEnabled()) return [];
  return (["SCHOOL_ADMIN", "TEACHER", "STUDENT_GUARDIAN"] as Role[]).flatMap((role) => {
    const email = demoEmail(role);
    return email ? [{ role, email }] : [];
  });
}
