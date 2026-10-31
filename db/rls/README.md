# RLS

`npm run db:rls` aplica, nesta ordem:

1. **`db/rls/rls-policies.sql`**, se o arquivo existir. É o seu arquivo real de políticas: coloque-o aqui.
2. Caso contrário, `db/rls/demo/*.sql`: um subconjunto de demonstração que cobre **só** as tabelas deste esquema
   parcial (organizations, schools, users, school_memberships, roles, user_role_assignments, teachers, guardians).
3. `db/auth/*.sql`: as funções `app_auth.*` usadas pelo login.

Nunca aplique o subconjunto de demonstração por cima do seu `rls-policies.sql` real: ele redefine as funções
`current_org_id()`, `current_school_ids()` e `current_user_id()`.

O app define, por requisição e dentro de uma transação, `app.current_org_id`, `app.current_school_ids` (lista separada
por vírgula) e `app.current_user_id` (veja `src/server/db/tenant.ts`).
