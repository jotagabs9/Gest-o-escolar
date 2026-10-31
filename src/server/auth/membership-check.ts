import { lookupMembership } from "@/server/auth/directory";
import { mapRoleNames } from "@/server/auth/roles";
import type { Role } from "@/types/auth";

/**
 * O JWT vale por horas, mas um usuário pode ser desativado, sair da escola ou mudar de papel antes disso.
 * Por isso a sessão é revalidada no banco, com cache curto por processo (no máximo 1 consulta/min por usuário).
 * Em caso de erro de banco, falha fechado (sessão inválida).
 */
const TTL_MS = 60_000;
const cache = new Map<string, { ok: boolean; at: number }>();

export async function isSessionStillValid(
  userId: string,
  organizationId: string,
  schoolId: string,
  role: Role,
): Promise<boolean> {
  const key = `${userId}:${organizationId}:${schoolId}:${role}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ok;

  let ok = false;
  try {
    const row = await lookupMembership(userId, schoolId);
    ok = !!row && row.organization_id === organizationId && mapRoleNames(row.role_names) === role;
  } catch (error) {
    console.error("[auth] falha ao revalidar a sessão", error);
    return false;
  }
  cache.set(key, { ok, at: Date.now() });
  return ok;
}
