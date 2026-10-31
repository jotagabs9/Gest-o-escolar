# Gestão Escolar

Sistema SaaS multi-tenant de gestão escolar. Stack: **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui +
Prisma + Auth.js (credenciais) + PostgreSQL com RLS**.

## Estado do projeto

| Parte | Situação |
|---|---|
| Login, sessão (`userId`, `role`, `schoolId`, `organizationId`), middleware, guards por papel | **Real** (Auth.js + banco) |
| Contexto de tenant para o RLS (`withTenant` / `withSession`) | **Pronto**, ainda não usado pelas telas |
| Telas: dashboards, estrutura acadêmica, alunos, responsáveis, professores, matrículas, notas, frequência, boletim | **Mock** (`src/lib/mock/`) |
| Server Actions reais com Zod e queries Prisma nas telas | **Próximos blocos** |

> `prisma/schema.prisma` deste projeto é **parcial**: só tem os models de autenticação (Organization, School, User,
> SchoolMembership, Role, UserRoleAssignment, Teacher, Guardian). Veja [Usando o seu schema e o seu RLS](#usando-o-seu-schema-e-o-seu-rls).

## Requisitos

- Node.js **20.6 ou mais novo** (os scripts usam `--env-file`)
- Docker (para o PostgreSQL de desenvolvimento)

## Início rápido

```bash
npm install
cp .env.example .env          # depois cole o AUTH_SECRET (npm run auth:secret)
npm run db:up                 # 1. sobe o PostgreSQL
npm run db:setup              # 3. tabelas + RLS + seed + verificação
npm run dev                   # 5. http://localhost:3000
```

Logins de teste (senha `senha123`): `admin@escola.com`, `professor@escola.com`, `responsavel@escola.com`.

## Passo a passo

### 1. Subir o banco (Docker)

```bash
npm run db:up        # docker compose up -d
docker compose ps    # o serviço "db" deve ficar "healthy"
```

Na **primeira** vez, o PostgreSQL executa `db/init/01-roles.sh` e cria a role de runtime `school_saas_runtime`
(`NOSUPERUSER`, `NOBYPASSRLS`). O usuário `postgres` é a role de **migração**: dona das tabelas, usada só por
`prisma db push`, seeds e scripts. O app nunca usa o `postgres`.

Para recomeçar do zero (apaga os dados): `npm run db:reset`.

### 2. Configurar o `.env`

```bash
cp .env.example .env
npm run auth:secret          # imprime a linha AUTH_SECRET="..." para colar no .env
```

| Variável | Para quê |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Role de **migração** (`postgres`): `prisma db push`, seeds, scripts |
| `RUNTIME_DATABASE_URL` | Role de **runtime**: a única que o app usa (o RLS vale para ela) |
| `AUTH_SECRET` | Chave de assinatura da sessão (obrigatória) |
| `ENABLE_DEMO_LOGIN`, `DEMO_*` | Botões de "acesso de demonstração" na tela de login (só fora de produção) |

Os valores de `.env.example` já funcionam com o `docker-compose.yml`. Se mudar a senha da role de runtime, defina
`RUNTIME_DB_PASSWORD` antes do `db:up` e use a mesma no `RUNTIME_DATABASE_URL`.

### 3. Migrations + RLS + seed

Tudo de uma vez:

```bash
npm run db:setup
```

ou etapa por etapa (nesta ordem):

```bash
npm run db:push          # cria as tabelas (prisma db push, role de migração)
npm run db:rls           # aplica o RLS e as funções de login (db/rls + db/auth)
npm run db:seed:base     # cria uma organização e uma escola de demonstração (se não houver)
npm run db:seed:auth     # cria roles e os 3 usuários de teste (passo 4)
npm run db:verify        # confere que a role de runtime NÃO fura o RLS
```

`db:rls` usa o seu `db/rls/rls-policies.sql` se ele existir; senão aplica o subconjunto de demonstração de
`db/rls/demo/`. Em produção, prefira migrations versionadas (`prisma migrate`) no lugar do `db push`.

### 4. Criar os usuários de teste

`npm run db:seed:auth` (já incluído no `db:seed`). Ele cria, de forma idempotente (pode rodar de novo):

- Roles de sistema `ADMIN_ESCOLA`, `PROFESSOR` e `RESPONSAVEL`
- Os usuários abaixo, cada um com `SchoolMembership` e `UserRoleAssignment` (escopo `SCHOOL`) na primeira escola ativa
- `Teacher` para o professor e `Guardian` para o responsável

Ele usa a role de migração e **recusa** `NODE_ENV=production` (as senhas são fracas de propósito).

### 5. Rodar o projeto

```bash
npm run dev
```

Abra http://localhost:3000. Sem sessão, você é levado para `/login`.

### 6. Logins de teste

| Papel | E-mail | Senha | Vai para |
|---|---|---|---|
| Admin da Escola | `admin@escola.com` | `senha123` | `/admin` |
| Professor (Rafael Nogueira) | `professor@escola.com` | `senha123` | `/professor` |
| Responsável (Carlos Almeida) | `responsavel@escola.com` | `senha123` | `/aluno` |

Com `ENABLE_DEMO_LOGIN="true"`, a tela de login também mostra três botões de acesso rápido.

**Dados ainda são mock.** O login é real, mas o conteúdo das telas vem de `src/lib/mock/`. Para as telas do professor e
do responsável funcionarem enquanto isso, o app liga o usuário real ao professor/responsável do mock **pelo e-mail**
(`DEMO_TEACHER_EMAIL` e `DEMO_GUARDIAN_EMAIL`). Se mudar os e-mails do seed, mude também essas variáveis. Em
desenvolvimento, as telas do professor têm um seletor "Demonstração: ver como" para trocar de professor do mock.

## Como a segurança funciona

- **Duas roles no banco.** Migração (`postgres`, dona das tabelas) e runtime (`school_saas_runtime`, sujeita ao RLS).
  `src/server/db/prisma.ts` recusa `RUNTIME_DATABASE_URL` igual à de migração ou com `postgres`/`service_role`.
- **Login sem ler a tabela de usuários.** `db/auth/001_auth_lookup.sql` cria funções `SECURITY DEFINER`
  (`app_auth.login_lookup` e `membership_lookup`); a role de runtime só executa essas funções.
- **Sessão (JWT, 8 h) revalidada no banco** (cache de 1 min): usuário desativado, fora da escola ou com outro papel
  perde o acesso.
- **Papel por escola.** Vem de `user_role_assignments` com escopo `SCHOOL` na escola ou `ORGANIZATION` na organização.
  Os nomes de `roles.name` são mapeados em `src/server/auth/roles.ts`.
- **RLS por requisição.** `withTenant`/`withSession` (`src/server/db/tenant.ts`) abrem uma transação e definem
  `app.current_org_id`, `app.current_school_ids` e `app.current_user_id` antes de qualquer query.
- **Middleware + guards.** `src/middleware.ts` barra quem não está logado e leva cada papel à sua área; as páginas
  e Server Actions continuam checando (`requireRole`).

Mais detalhes em [`docs/auth.md`](docs/auth.md).

## Estrutura

```
.
├── docker-compose.yml          PostgreSQL 16 (dev)
├── .env.example
├── package.json
├── prisma/
│   └── schema.prisma           PARCIAL (models de autenticação)
├── db/
│   ├── init/01-roles.sh        cria a role de runtime (roda 1x no container)
│   ├── rls/                    rls-policies.sql (o seu) ou demo/ (subconjunto de demonstração)
│   └── auth/001_auth_lookup.sql  funções de login (SECURITY DEFINER)
├── scripts/                    db-apply, seed-base, seed-auth-users, verify-runtime-role, debug-login-lookup, ...
├── docs/                       auth.md e historico/ (notas de cada lote de telas)
└── src/
    ├── auth.ts, auth.config.ts, middleware.ts
    ├── app/
    │   ├── (auth)/login/
    │   ├── (dashboard)/admin | professor | aluno/   telas por papel
    │   └── api/auth/[...nextauth]/
    ├── components/             ui/ (shadcn), layout/, dashboard/, academic/, people/, assessment/, auth/
    ├── lib/                    session, nav, roles, format, assessment, mock/
    ├── server/                 auth/ (login, papéis, ações), db/ (Prisma runtime, tenant)
    └── types/
```

## Scripts npm

| Script | O que faz |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `typecheck` / `test` | TypeScript e testes (vitest) |
| `db:up` / `db:down` / `db:reset` | Docker do banco |
| `db:push` | Cria/atualiza as tabelas (role de migração) |
| `db:rls` | Aplica RLS e funções de login |
| `db:seed`, `db:seed:base`, `db:seed:auth` | Seeds |
| `db:verify` | Confere a role de runtime (sem superusuário, sem BYPASSRLS, sem ser dona de tabelas) |
| `db:debug-login -- <email>` | Mostra o que o login enxerga para um e-mail |
| `db:setup` | `db:push` + `db:rls` + `db:seed` + `db:verify` |
| `auth:secret`, `auth:hash -- "senha"` | Gera `AUTH_SECRET` e hash bcrypt |

## Usando o seu schema e o seu RLS

O `prisma/schema.prisma` e o RLS deste projeto são suficientes para o login. Para o sistema completo:

1. Substitua `prisma/schema.prisma` pelo seu schema completo.
2. Coloque o seu `rls-policies.sql` em `db/rls/rls-policies.sql`. O `db:rls` passa a usá-lo e ignora `db/rls/demo/`.
3. Se as suas funções de RLS leem outros nomes de configuração, ajuste `src/server/db/tenant-settings.ts`.
4. Confira `SELECT DISTINCT name FROM roles;` contra `src/server/auth/roles.ts`.
5. Rode `npm run db:push`, `npm run db:rls`, `npm run db:seed` e `npm run db:verify`.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `db:push` não conecta | `docker compose ps`; a porta 5432 pode estar ocupada por outro Postgres |
| `password authentication failed for user "school_saas_runtime"` | A senha do `.env` não bate com a do compose. `npm run db:reset` recria o banco |
| `function app_auth.login_lookup(...) does not exist` | Rode `npm run db:rls` |
| "E-mail ou senha incorretos" | `npm run db:debug-login -- admin@escola.com` mostra escolas, roles e o papel escolhido |
| `MissingSecret` | Defina `AUTH_SECRET` no `.env` e reinicie o `npm run dev` |
| `RUNTIME_DATABASE_URL ... ignora o RLS` | O app recusou uma conexão de migração. Use a role `school_saas_runtime` |
| Next.js 16 avisa sobre `middleware` | Renomeie `src/middleware.ts` para `src/proxy.ts` e exporte `proxy` (veja `docs/auth.md`) |
| Seed reclama de campo obrigatório | Com o seu schema real, algum model pode ter campos obrigatórios a mais; ajuste os `create` dos scripts |
| Windows: erro ao rodar `01-roles.sh` | Fim de linha CRLF; o `.gitattributes` força LF, então refaça o clone/checkout |

## Segurança

- `senha123` e os e-mails de teste são **apenas para desenvolvimento**. Não deixe esses usuários em um banco acessível
  pela internet.
- Nunca versione o `.env`. Em produção, defina `AUTH_SECRET` e `AUTH_URL` e **não** habilite `ENABLE_DEMO_LOGIN`.
- O limitador de tentativas de login é em memória (por instância). Em produção com várias instâncias, use Redis ou tabela.
