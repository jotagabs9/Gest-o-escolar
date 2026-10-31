/**
 * Conexão da role de MIGRAÇÃO (DIRECT_URL ou DATABASE_URL), usada pelos scripts que escrevem no banco
 * (seed, aplicação de SQL). Recusa a conexão de runtime: ela está sujeita ao RLS e não deve ser usada aqui.
 */
export function migrationUrl(): string {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Defina DIRECT_URL (ou DATABASE_URL): a conexão da role de MIGRAÇÃO.");
  if (url === process.env.RUNTIME_DATABASE_URL) {
    throw new Error("A conexão encontrada é a de runtime. Este script precisa da role de migração (DIRECT_URL/DATABASE_URL).");
  }
  const role = decodeURIComponent(new URL(url).username).toLowerCase().split(".")[0];
  if (role === "school_saas_runtime") {
    throw new Error('DIRECT_URL/DATABASE_URL usa a role "school_saas_runtime". Use a role de migração.');
  }
  return url;
}

/** O driver `pg` não conhece parâmetros específicos do Prisma (schema, pgbouncer, connection_limit). */
export function pgConnectionString(url: string): string {
  const u = new URL(url);
  for (const key of ["schema", "pgbouncer", "connection_limit", "pool_timeout"]) u.searchParams.delete(key);
  return u.toString();
}
