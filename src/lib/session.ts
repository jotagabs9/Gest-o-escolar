import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ROLE_HOME } from "@/lib/roles";
import { isSessionStillValid } from "@/server/auth/membership-check";
import type { Role, SessionUser } from "@/types/auth";

/**
 * Sessão real (Auth.js, JWT) com userId, role, schoolId e organizationId.
 * A assinatura de getSession/requireSession/requireRole é a mesma do mock, então as páginas não mudam.
 *
 * Além de validar o JWT, confirma no banco (com cache de 1 min) que o vínculo continua ativo e com o mesmo papel.
 * `cache` do React evita repetir a checagem dentro de uma mesma requisição.
 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.role || !u.schoolId) return null;
  if (!(await isSessionStillValid(u.id, u.organizationId, u.schoolId, u.role))) return null;

  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: u.role,
    schoolId: u.schoolId,
    schoolName: u.schoolName,
    organizationId: u.organizationId,
    organizationName: u.organizationName,
  };
});

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Guard de papel: quem acessa a área errada é levado ao próprio dashboard. */
export async function requireRole(role: Role): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== role) redirect(ROLE_HOME[session.role]);
  return session;
}
