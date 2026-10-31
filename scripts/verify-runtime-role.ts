/**
 * Confirma que o app está mesmo conectado com a role de runtime e que ela NÃO fura o RLS.
 *   npx tsx --env-file=.env scripts/verify-runtime-role.ts
 */
import { getPrisma } from "../src/server/db/prisma";

async function main() {
  const prisma = getPrisma();

  const [role] = await prisma.$queryRaw<{ current_user: string; rolsuper: boolean; rolbypassrls: boolean }[]>`
    SELECT current_user, r.rolsuper, r.rolbypassrls FROM pg_roles r WHERE r.rolname = current_user`;
  const [owned] = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM pg_tables WHERE schemaname = 'public' AND tableowner = current_user`;
  const [fn] = await prisma.$queryRaw<{ ok: boolean }[]>`
    SELECT has_function_privilege(current_user, 'app_auth.login_lookup(text)', 'EXECUTE') AS ok`;

  const [fn2] = await prisma.$queryRaw<{ ok: boolean }[]>`
    SELECT has_function_privilege(current_user, 'app_auth.membership_lookup(text, text)', 'EXECUTE') AS ok`;

  const checks: [string, boolean][] = [
    [`role atual: ${role.current_user}`, true],
    ["não é superusuário", !role.rolsuper],
    ["não tem BYPASSRLS", !role.rolbypassrls],
    ["não é dona de tabelas (dona ignora o RLS)", Number(owned.n) === 0],
    ["pode executar app_auth.login_lookup", fn.ok],
    ["pode executar app_auth.membership_lookup", fn2.ok],
  ];
  for (const [label, ok] of checks) console.log(`${ok ? "OK   " : "FALHA"}  ${label}`);

  await prisma.$disconnect();
  process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
