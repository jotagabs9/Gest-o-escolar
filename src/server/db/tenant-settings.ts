/**
 * Configurações de sessão do Postgres que as políticas de RLS leem (rls-policies.sql):
 *   current_org_id()      ← app.current_org_id
 *   current_school_ids()  ← app.current_school_ids   (lista separada por vírgula → text[])
 *   current_user_id()     ← app.current_user_id
 * Parte pura (sem Prisma/Next), para poder ser testada.
 */
export const TENANT_SETTING_NAMES = {
  orgId: "app.current_org_id",
  schoolIds: "app.current_school_ids",
  userId: "app.current_user_id",
} as const;

export interface TenantContext {
  userId: string;
  organizationId: string;
  /** Escolas que a requisição pode enxergar. A sessão comum usa só a escola atual. */
  schoolIds: string[];
}

/**
 * Ids são cuid (letras, números, "_" e "-"). A validação é de segurança, e não só de formato:
 * `current_school_ids` é uma lista separada por vírgula, então um id com vírgula ampliaria o acesso a outras escolas.
 */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function checkId(label: string, value: unknown): string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new Error(`Contexto de tenant inválido: ${label}.`);
  }
  return value;
}

/** Valida o contexto e devolve os pares nome/valor para `set_config(nome, valor, true)` (equivale a SET LOCAL). */
export function buildTenantSettings(ctx: TenantContext): { name: string; value: string }[] {
  const userId = checkId("userId", ctx.userId);
  const organizationId = checkId("organizationId", ctx.organizationId);
  if (!Array.isArray(ctx.schoolIds) || ctx.schoolIds.length === 0) {
    throw new Error("Contexto de tenant inválido: nenhuma escola.");
  }
  const schoolIds = [...new Set(ctx.schoolIds.map((id) => checkId("schoolId", id)))];

  return [
    { name: TENANT_SETTING_NAMES.orgId, value: organizationId },
    { name: TENANT_SETTING_NAMES.schoolIds, value: schoolIds.join(",") },
    { name: TENANT_SETTING_NAMES.userId, value: userId },
  ];
}
