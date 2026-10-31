import { ROLE_HOME } from "@/lib/roles";
import type { Role } from "@/types/auth";

export type AccessDecision =
  | { type: "allow" }
  | { type: "login" }
  | { type: "redirect"; to: string };

const AREA_ROLE: { prefix: string; role: Role }[] = [
  { prefix: "/admin", role: "SCHOOL_ADMIN" },
  { prefix: "/professor", role: "TEACHER" },
  { prefix: "/aluno", role: "STUDENT_GUARDIAN" },
];

/**
 * Decide o acesso a um caminho só com o papel do token (sem consultar o banco).
 * É a primeira barreira (middleware). A autorização de verdade continua nas páginas e nas Server Actions.
 */
export function decideAccess(pathname: string, role: Role | null | undefined): AccessDecision {
  if (pathname === "/login" || pathname.startsWith("/api/auth")) return { type: "allow" };
  if (!role) return { type: "login" };
  const area = AREA_ROLE.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (area && area.role !== role) return { type: "redirect", to: ROLE_HOME[role] };
  return { type: "allow" };
}
