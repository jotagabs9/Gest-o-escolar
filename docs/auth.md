# Bloco 1: Autenticação real + sessão (schoolId, role), alinhado ao schema real

## 1. Dependências
Já estão no `package.json` do projeto (`next-auth@beta`, `bcryptjs`, `zod`, `tsx`). `npm install` basta.

## 2. Variáveis de ambiente
Veja `.env.example`: RUNTIME_DATABASE_URL, AUTH_SECRET e, em desenvolvimento, os DEMO_*.

## 3. Conferir os nomes dos Roles
O mapeamento usa `roles.name`. Veja os nomes que existem no seu banco:
```sql
SELECT DISTINCT name FROM roles ORDER BY name;
```
Eles precisam estar em `src/server/auth/roles.ts` (`ROLE_NAME_TO_APP`). Já valem: ADMIN_ESCOLA, PROFESSOR, RESPONSAVEL,
ALUNO (e equivalentes em inglês), sem diferenciar caixa, acento ou separador.

## 4. Banco (role de migração)
Execute `db/auth/001_auth_lookup.sql` com a role dona das tabelas. O Postgres valida os nomes de tabelas e colunas ao
criar as funções, então qualquer divergência aparece como erro na hora. Depois grave um hash de senha nos usuários de teste:
```bash
node scripts/hash-password.mjs "senha-de-dev-forte"
# UPDATE users SET password_hash = '<hash>' WHERE lower(email) = lower('admin@escola.edu.br');
```

## 4b. Usuários de teste (seed)
```bash
npx tsx --env-file=.env scripts/seed-auth-users.ts
```
Cria (ou atualiza) os Roles ADMIN_ESCOLA, PROFESSOR e RESPONSAVEL (de sistema) e os usuários `admin@escola.com`,
`professor@escola.com` (com Teacher) e `responsavel@escola.com` (com Guardian), todos com a senha `senha123`, vinculados à
primeira organização/escola ativas. Roda com a role de **migração** (DIRECT_URL/DATABASE_URL) e recusa NODE_ENV=production.
No `.env`, use `DEMO_*_EMAIL` iguais a esses e `DEMO_PASSWORD="senha123"`.

## 5. Conferir o que o login enxerga (sem abrir o navegador)
```bash
npx tsx --env-file=.env scripts/debug-login-lookup.ts admin@escola.edu.br
npx tsx --env-file=.env scripts/verify-runtime-role.ts
```
O primeiro mostra escolas ativas, nomes de Role e a escola/papel que a sessão escolheria. O segundo falha se a role de
runtime for superusuária, tiver BYPASSRLS, for dona de tabelas ou não puder executar as funções `app_auth.*`.

## 6. Testes das partes puras
`npx vitest run src/server/auth` (acesso por papel, mapeamento de Roles, escolha da escola padrão, contexto do RLS, limitador).

## Como o login decide
1. Usuário pelo e-mail (ativo, organização ativa).
2. Senha (bcrypt). E-mail inexistente e senha errada dão a mesma resposta, no mesmo tempo.
3. Escolas: `school_memberships` ativas, de escola ativa **da mesma organização do usuário**.
4. Papel em cada escola: `user_role_assignments` com escopo SCHOOL naquela escola ou ORGANIZATION na organização do
   usuário (Role de sistema ou da organização). Escopo CLASS_GROUP não define o papel da escola.
5. Escola padrão: entre as escolas com papel reconhecido, a de papel de maior prioridade (admin, professor, responsável),
   depois por nome. Com vários papéis na escola, vale o de maior prioridade.
6. Sessão: userId, organizationId, schoolId, schoolName, organizationName e role.

## RLS: contexto por requisição
`withTenant` e `withSession` (`src/server/db/tenant.ts`) abrem uma transação e definem, com `set_config(..., true)`
(equivale a SET LOCAL), antes de qualquer query: `app.current_org_id`, `app.current_school_ids` e `app.current_user_id`.
A sessão comum envia só a escola atual. Os ids são validados (a lista é separada por vírgula, então um id com vírgula
ampliaria o acesso).

## Next.js 16
O Next 16 renomeou `middleware.ts` para `proxy.ts`. Se for o seu caso, renomeie `src/middleware.ts` para `src/proxy.ts`
e troque o `export default` por `export const proxy = NextAuth(authConfig).auth;`.

## Prisma 7
`datasourceUrl` não existe no Prisma 7. Veja o comentário em `src/server/db/prisma.ts` (adapter `@prisma/adapter-pg`).

## Ainda suposto
- Os valores de `roles.name` (item 3).
- `user_role_assignments` sem coluna de revogação/validade (se houver, acrescente o filtro no TODO do SQL).
- Atribuição de papel ao responsável/professor feita com escopo SCHOOL ou ORGANIZATION (e não só CLASS_GROUP).
- Responsável precisa de `school_memberships` ativa para entrar (`guardians` não tem `school_id`).
