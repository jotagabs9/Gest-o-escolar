/**
 * Mostra o que o login enxerga para um e-mail (sem imprimir o hash): escolas ativas, nomes de Role e o papel/escola
 * que a sessão escolheria. Útil para conferir os dados de seed sem abrir o navegador.
 *   npx tsx --env-file=.env scripts/debug-login-lookup.ts admin@escola.edu.br
 */
import { lookupLogin } from "../src/server/auth/directory";
import { getPrisma } from "../src/server/db/prisma";
import { mapRoleNames, resolveLoginSession } from "../src/server/auth/roles";

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    console.error("Uso: npx tsx --env-file=.env scripts/debug-login-lookup.ts <email>");
    process.exit(1);
  }

  const rows = await lookupLogin(email);
  if (rows.length === 0) {
    console.log("Nenhuma linha: e-mail inexistente, usuário/organização inativos, ou sem vínculo ativo com escola ativa.");
  }
  for (const r of rows) {
    console.log(
      `escola=${r.school_name} (${r.school_id}) org=${r.organization_name} (${r.organization_id}) ` +
        `roles=[${(r.role_names ?? []).join(", ")}] → ${mapRoleNames(r.role_names) ?? "SEM PAPEL COM TELA"}`,
    );
  }
  const chosen = resolveLoginSession(rows);
  console.log(chosen ? `\nSessão: escola ${chosen.row.school_name}, papel ${chosen.role}` : "\nSessão: login seria NEGADO.");
  await getPrisma().$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
