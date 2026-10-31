import { getPrisma } from "@/server/db/prisma";

/**
 * ÚNICO ponto de acesso a usuários/vínculos para autenticação.
 * Chama funções SECURITY DEFINER (db/auth/001_auth_lookup.sql): o login acontece antes de existir tenant,
 * e a role de runtime não precisa (nem deve) ler a tabela `users` nem o hash da senha diretamente.
 */

/** Uma linha por escola ativa do usuário. */
export interface LoginRow {
  user_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  organization_id: string;
  organization_name: string;
  school_id: string;
  school_name: string;
  /** Nomes dos Roles (roles.name) aplicáveis nessa escola (escopo SCHOOL ou ORGANIZATION). */
  role_names: string[] | null;
}

export interface MembershipRow {
  organization_id: string;
  school_id: string;
  role_names: string[] | null;
}

export async function lookupLogin(email: string): Promise<LoginRow[]> {
  return getPrisma().$queryRaw<LoginRow[]>`SELECT * FROM app_auth.login_lookup(${email})`;
}

/** Vínculo ativo do usuário naquela escola (para revalidar a sessão). Nulo se desativado ou removido. */
export async function lookupMembership(userId: string, schoolId: string): Promise<MembershipRow | null> {
  const rows = await getPrisma().$queryRaw<MembershipRow[]>`
    SELECT * FROM app_auth.membership_lookup(${userId}, ${schoolId})`;
  return rows[0] ?? null;
}
