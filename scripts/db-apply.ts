/**
 * Aplica os arquivos SQL do banco com a role de MIGRAÇÃO, nesta ordem:
 *   1. db/rls/rls-policies.sql (se existir: é o seu arquivo real), senão db/rls/demo/*.sql
 *   2. db/auth/*.sql (funções de login)
 * Rode depois do `prisma db push` (os SQLs dependem das tabelas). É idempotente.
 *
 *   npm run db:rls
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

import { migrationUrl, pgConnectionString } from "./_lib/migration-url";

const dbDir = join(process.cwd(), "db");

function sqlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));
}

async function main() {
  const real = join(dbDir, "rls", "rls-policies.sql");
  const rls = existsSync(real) ? [real] : sqlFiles(join(dbDir, "rls", "demo"));
  const files = [...rls, ...sqlFiles(join(dbDir, "auth"))];

  if (files.length === 0) throw new Error("Nenhum arquivo SQL encontrado em db/rls e db/auth.");
  console.log(existsSync(real) ? "RLS: usando db/rls/rls-policies.sql (o seu)." : "RLS: usando o subconjunto de demonstração (db/rls/demo).");

  const client = new Client({ connectionString: pgConnectionString(migrationUrl()) });
  await client.connect();
  try {
    for (const file of files) {
      console.log(`→ ${file.replace(process.cwd() + "/", "")}`);
      await client.query(readFileSync(file, "utf8"));
    }
    console.log("\nSQL aplicado.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`\nFalha ao aplicar o SQL: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
