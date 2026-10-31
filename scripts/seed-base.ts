/**
 * Seed BASE de desenvolvimento: garante uma Organization e uma School ativas (se ainda não houver nenhuma).
 * O seed de usuários (seed-auth-users.ts) precisa delas. Se o seu banco já tem os dados do seu seed principal,
 * este script não cria nada.
 *
 *   npm run db:seed:base
 */
import { PrismaClient } from "@prisma/client";

import { migrationUrl } from "./_lib/migration-url";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed de desenvolvimento: não roda com NODE_ENV=production.");

  const prisma = new PrismaClient({ datasourceUrl: migrationUrl() });
  try {
    let org = await prisma.organization.findFirst({ where: { isActive: true }, orderBy: { id: "asc" } });
    if (org) {
      console.log(`Organização existente: ${org.name} (${org.id})`);
    } else {
      org = await prisma.organization.create({ data: { name: "Rede Estadual de Ensino (demo)" } });
      console.log(`Organização criada: ${org.name} (${org.id})`);
    }

    const school = await prisma.school.findFirst({ where: { organizationId: org.id, isActive: true }, orderBy: { id: "asc" } });
    if (school) {
      console.log(`Escola existente: ${school.name} (${school.id})`);
    } else {
      const created = await prisma.school.create({ data: { organizationId: org.id, name: "Colégio Estadual Albert Sabin (demo)" } });
      console.log(`Escola criada: ${created.name} (${created.id})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`\nFalha no seed base: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
