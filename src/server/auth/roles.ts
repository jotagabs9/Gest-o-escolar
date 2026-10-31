import type { Role } from "@/types/auth";

/**
 * Nome do Role no banco (roles.name) → papel da aplicação.
 * As chaves são NORMALIZADAS (maiúsculas, sem acento, separadores viram "_"), então "Admin Escola",
 * "admin-escola" e "ADMIN_ESCOLA" valem o mesmo. Confira os nomes reais com:
 *   SELECT DISTINCT name FROM roles ORDER BY name;
 * Role cujo nome não está aqui (ex.: administrador da organização) NÃO abre nenhuma área.
 */
const ROLE_NAME_TO_APP: Record<string, Role> = {
  ADMIN_ESCOLA: "SCHOOL_ADMIN",
  ADMIN_DA_ESCOLA: "SCHOOL_ADMIN",
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  PROFESSOR: "TEACHER",
  TEACHER: "TEACHER",
  RESPONSAVEL: "STUDENT_GUARDIAN",
  GUARDIAN: "STUDENT_GUARDIAN",
  ALUNO: "STUDENT_GUARDIAN",
  STUDENT: "STUDENT_GUARDIAN",
  ALUNO_RESPONSAVEL: "STUDENT_GUARDIAN",
};

/** Quando a pessoa tem mais de um papel na mesma escola, vale o de menor número. */
export const ROLE_PRIORITY: Record<Role, number> = {
  SCHOOL_ADMIN: 0,
  TEACHER: 1,
  STUDENT_GUARDIAN: 2,
};

export function normalizeRoleName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function mapRoleName(name: string): Role | null {
  return ROLE_NAME_TO_APP[normalizeRoleName(name)] ?? null;
}

/** Papel principal a partir dos nomes de Role que a pessoa tem na escola. Nulo se nenhum tem tela. */
export function mapRoleNames(names: readonly string[] | null | undefined): Role | null {
  const roles = (names ?? []).flatMap((n) => {
    const r = mapRoleName(n);
    return r ? [r] : [];
  });
  if (roles.length === 0) return null;
  return roles.reduce((best, r) => (ROLE_PRIORITY[r] < ROLE_PRIORITY[best] ? r : best));
}

/**
 * Escolhe a escola padrão da sessão entre os vínculos ativos do usuário:
 * só entram escolas onde há papel reconhecido; vence o papel de maior prioridade, depois o nome da escola.
 */
export function resolveLoginSession<T extends { school_id: string; school_name: string; role_names: string[] | null }>(
  rows: readonly T[],
): { row: T; role: Role } | null {
  const candidates = rows.flatMap((row) => {
    const role = mapRoleNames(row.role_names);
    return role ? [{ row, role }] : [];
  });
  candidates.sort(
    (a, b) =>
      ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role] ||
      a.row.school_name.localeCompare(b.row.school_name, "pt-BR") ||
      a.row.school_id.localeCompare(b.row.school_id),
  );
  return candidates[0] ?? null;
}
