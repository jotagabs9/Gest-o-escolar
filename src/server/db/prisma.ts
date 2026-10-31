import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client SEMPRE na role de runtime (RUNTIME_DATABASE_URL), nunca na de migração.
 * A role de runtime é NOSUPERUSER/NOBYPASSRLS, então as políticas de RLS valem em toda query.
 *
 * Criado sob demanda (não no import) para o `next build` não exigir o banco.
 *
 * PRISMA 7: `datasourceUrl` foi removido. Troque o construtor por:
 *   import { PrismaPg } from "@prisma/adapter-pg";
 *   new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
 * (e importe o PrismaClient do caminho gerado, conforme o seu `generator`).
 */

/** Recusa credenciais que furariam o RLS (migração, superusuário, service_role). */
export function assertSafeRuntimeUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("RUNTIME_DATABASE_URL não está definida. O app só acessa o banco pela role de runtime.");
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === url) {
    throw new Error("RUNTIME_DATABASE_URL é igual a DATABASE_URL (role de migração). Use a role de runtime.");
  }
  let user = "";
  try {
    user = decodeURIComponent(new URL(url).username).toLowerCase();
  } catch {
    throw new Error("RUNTIME_DATABASE_URL inválida.");
  }
  // No pooler do Supabase o usuário vem como "role.<ref-do-projeto>".
  const role = user.split(".")[0];
  if (role === "postgres" || role === "service_role" || role === "supabase_admin") {
    throw new Error(`RUNTIME_DATABASE_URL usa a role "${role}", que ignora o RLS. Use a role de runtime.`);
  }
  return url;
}

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = new PrismaClient({
      datasourceUrl: assertSafeRuntimeUrl(process.env.RUNTIME_DATABASE_URL),
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.__prisma;
}
