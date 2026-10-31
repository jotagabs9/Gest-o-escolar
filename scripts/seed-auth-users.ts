/**
 * Seed de usuários de TESTE para o login real (admin, professor, responsável).
 *
 *   npx tsx --env-file=.env scripts/seed-auth-users.ts
 *
 * - Usa a conexão da role de MIGRAÇÃO (DIRECT_URL ou DATABASE_URL), e NÃO a de runtime: a role de runtime está
 *   sujeita ao RLS e não consegue criar esses registros (de propósito).
 * - Idempotente: pode rodar de novo. Reaplica a senha e reativa os registros de teste.
 * - Tudo em uma transação: se qualquer passo falhar (inclusive um trigger de integridade), nada é gravado.
 * - Senha fraca e e-mails públicos: SOMENTE desenvolvimento. O script recusa NODE_ENV=production.
 *
 * Prisma 7: `datasourceUrl` não existe; use o adapter (@prisma/adapter-pg), como no comentário de src/server/db/prisma.ts.
 */
import { PrismaClient, ScopeType } from "@prisma/client";

import { hashPassword } from "../src/server/auth/password";
import { migrationUrl } from "./_lib/migration-url";

const PASSWORD = "senha123";

const ROLES = [
  { name: "ADMIN_ESCOLA", description: "Administrador da escola" },
  { name: "PROFESSOR", description: "Professor" },
  { name: "RESPONSAVEL", description: "Responsável pelo aluno" },
] as const;
type RoleName = (typeof ROLES)[number]["name"];

const USERS: { email: string; fullName: string; role: RoleName }[] = [
  { email: "admin@escola.com", fullName: "Admin da Escola", role: "ADMIN_ESCOLA" },
  { email: "professor@escola.com", fullName: "Rafael Nogueira", role: "PROFESSOR" },
  { email: "responsavel@escola.com", fullName: "Carlos Almeida", role: "RESPONSAVEL" },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Este seed cria usuários com senha fraca e não roda com NODE_ENV=production.");
  }

  const url = migrationUrl();
  console.log(`Banco: ${new URL(url).host}`);
  const prisma = new PrismaClient({ datasourceUrl: url });

  try {
    // 1) Primeira organização e primeira escola (ativas; a escola precisa ser da mesma organização).
    const org = await prisma.organization.findFirst({ where: { isActive: true }, orderBy: { id: "asc" } });
    if (!org) throw new Error("Nenhuma Organization ativa. Rode o seed principal do banco antes.");
    const school = await prisma.school.findFirst({
      where: { organizationId: org.id, isActive: true },
      orderBy: { id: "asc" },
    });
    if (!school) throw new Error(`A organização "${org.name}" não tem School ativa. Rode o seed principal antes.`);

    // Hashes fora da transação (bcrypt é lento e não deve segurar a conexão aberta).
    const hashes = await Promise.all(USERS.map(() => hashPassword(PASSWORD)));

    await prisma.$transaction(
      async (tx) => {
        // 2) Roles de sistema. `organizationId` nulo não entra em upsert composto do Prisma, por isso find + create/update.
        const roleIds = {} as Record<RoleName, string>;
        for (const { name, description } of ROLES) {
          const candidates = await tx.role.findMany({
            where: { name, OR: [{ organizationId: null }, { organizationId: org.id }] },
          });
          const existing = candidates.find((r) => r.organizationId === null) ?? candidates[0];
          const role = existing
            ? await tx.role.update({ where: { id: existing.id }, data: { isSystemRole: true } })
            : await tx.role.create({ data: { name, description, isSystemRole: true, organizationId: null } });
          roleIds[name] = role.id;
        }

        // 3) Usuários, vínculo com a escola, papel (escopo SCHOOL) e perfil de Teacher/Guardian.
        for (const [i, u] of USERS.entries()) {
          const found = await tx.user.findUnique({ where: { email: u.email } });
          if (found && found.organizationId !== org.id) {
            throw new Error(`${u.email} já existe em outra organização. Remova-o ou use outro e-mail.`);
          }

          const user = await tx.user.upsert({
            where: { email: u.email },
            create: { organizationId: org.id, email: u.email, passwordHash: hashes[i], fullName: u.fullName, isActive: true },
            update: { passwordHash: hashes[i], fullName: u.fullName, isActive: true },
          });

          await tx.schoolMembership.upsert({
            where: { userId_schoolId: { userId: user.id, schoolId: school.id } },
            create: { userId: user.id, schoolId: school.id, isActive: true },
            update: { isActive: true },
          });

          await tx.userRoleAssignment.upsert({
            where: {
              userId_roleId_scopeType_scopeId: {
                userId: user.id,
                roleId: roleIds[u.role],
                scopeType: ScopeType.SCHOOL,
                scopeId: school.id,
              },
            },
            create: { userId: user.id, roleId: roleIds[u.role], scopeType: ScopeType.SCHOOL, scopeId: school.id },
            update: {},
          });

          if (u.role === "PROFESSOR") {
            await tx.teacher.upsert({
              where: { userId: user.id },
              create: { userId: user.id, schoolId: school.id, fullName: u.fullName, isActive: true },
              update: { schoolId: school.id, fullName: u.fullName, isActive: true },
            });
          }

          if (u.role === "RESPONSAVEL") {
            await tx.guardian.upsert({
              where: { userId: user.id },
              create: { userId: user.id, fullName: u.fullName, email: u.email },
              update: { fullName: u.fullName, email: u.email },
            });
          }
        }
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    // 5) Resumo.
    console.log(`\nOrganização: ${org.name} (${org.id})`);
    console.log(`Escola:      ${school.name} (${school.id})\n`);
    console.log("Usuários de teste:");
    for (const u of USERS) console.log(`  ${u.email.padEnd(26)} ${u.role}`);
    console.log(`\nSenha de todos: ${PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`\nFalha no seed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
