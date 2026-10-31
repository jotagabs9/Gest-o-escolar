import type { Prisma } from "@prisma/client";

import { requireSession } from "@/lib/session";
import { getPrisma } from "@/server/db/prisma";
import { buildTenantSettings, type TenantContext } from "@/server/db/tenant-settings";

export type { TenantContext } from "@/server/db/tenant-settings";

/**
 * Executa `fn` em uma transação com as três configurações do RLS já definidas
 * (app.current_org_id, app.current_school_ids, app.current_user_id), via set_config(..., true),
 * que equivale a SET LOCAL: vale só até o fim desta transação (seguro com pooler em transaction mode).
 *
 * TODA query de dados da escola deve passar por aqui. Fora dela o RLS não enxerga nenhuma escola.
 */
export async function withTenant<T>(
  ctx: TenantContext,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const settings = buildTenantSettings(ctx); // valida antes de abrir a transação
  const [org, schools, user] = settings;

  return getPrisma().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT
        set_config(${org.name}, ${org.value}, true),
        set_config(${schools.name}, ${schools.value}, true),
        set_config(${user.name}, ${user.value}, true)`;
      return fn(tx);
    },
    { timeout: 10_000 },
  );
}

/**
 * Atalho para páginas e Server Actions: o contexto vem SEMPRE da sessão validada (usuário, organização e a
 * escola atual), nunca de parâmetros da requisição. Uma sessão enxerga uma escola por vez.
 */
export async function withSession<T>(
  fn: (tx: Prisma.TransactionClient, session: Awaited<ReturnType<typeof requireSession>>) => Promise<T>,
): Promise<T> {
  const session = await requireSession();
  return withTenant(
    { userId: session.id, organizationId: session.organizationId, schoolIds: [session.schoolId] },
    (tx) => fn(tx, session),
  );
}
