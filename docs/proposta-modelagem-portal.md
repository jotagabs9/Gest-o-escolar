# Proposta de modelagem — identidades do portal

Este documento complementa `plano-login-alunos-responsaveis.md`. É uma proposta para revisão; **não é migration executável** e não deve ser aplicada ao Supabase.

## Por que não basta adicionar um campo de matrícula em User

O login atual foi construído para funcionários:
- `User.email` é obrigatório e globalmente único.
- Cada sessão exige `User`, `SchoolMembership` e `UserRoleAssignment`.
- `app_auth.login_lookup(email)` retorna uma linha por escola.
- `membership_lookup(user_id, school_id)` revalida a sessão como funcionário/membro.
- `Guardian.userId` é opcional, mas `Guardian` não tem escola; não existe Student nem StudentGuardian no schema atual.

Forçar aluno a ter e-mail inventado ou colocar matrícula no campo email criaria semântica falsa, colisões e risco de misturar identidades de funcionário e estudante. O portal precisa de identidade própria e de uma validação de escopo própria.

## Modelo recomendado para o portal

### PortalAccount
Identidade de autenticação de aluno ou responsável:
- `id`
- `organizationId`
- `schoolId` (escopo inicial explícito; se uma conta familiar precisar operar em várias escolas, isso será modelado por vínculos, não por seleção livre)
- `kind`: `STUDENT` ou `GUARDIAN`
- `loginIdentifierNormalized`: matrícula para estudante ou e-mail para responsável
- `passwordHash`
- `isActive`
- `mustChangePassword`
- `passwordChangedAt`, `lastLoginAt`, timestamps

Índice único recomendado: `(schoolId, kind, loginIdentifierNormalized)`. Para e-mail de responsável, normalizar com trim + lowercase. A regra de uma conta de responsável por escola precisa ser validada com a secretaria.

### Student
- `id`, `schoolId`, `fullName`, `birthDate`, `officialRegistrationNumber`, `isActive`, timestamps.
- Matrícula é fornecida/confirmada pela secretaria; não é gerada pelo sistema.
- Restrição única: `(schoolId, officialRegistrationNumber)`.
- Relação opcional 1:1 com PortalAccount de tipo STUDENT.

### Guardian
- Preservar o modelo atual e acrescentar apenas as relações necessárias depois de conferir as tabelas reais.
- Não tornar o e-mail obrigatório no cadastro de pessoas: responsável pode existir sem conta de portal.
- Relação opcional 1:1 com PortalAccount de tipo GUARDIAN.

### StudentGuardian
- `schoolId`, `studentId`, `guardianId`, `relationship`, `isPrimary`, `isActive`, timestamps.
- Restrição única para impedir duplicar o mesmo vínculo.
- Chaves estrangeiras compostas/validações para garantir que aluno, responsável e vínculo pertençam à mesma escola/organização.
- Um responsável pode ter vários alunos; um aluno pode ter mais de um responsável.

## Sessão e autorização

Não reutilizar cegamente `membership_lookup` para contas do portal. Criar um principal de sessão discriminado:
- `principalType = STAFF | STUDENT | GUARDIAN`
- `principalId`
- `organizationId`
- `schoolId`
- papel correspondente, sem confundir os dois tipos de portal.

O callback de sessão e os guards precisam validar o tipo de principal. A conta STUDENT só consulta seu próprio Student e seus dados acadêmicos. A conta GUARDIAN consulta apenas Students ligados por StudentGuardian ativo. O `schoolId` vem do registro autenticado e nunca de parâmetro controlado pelo navegador.

O login do funcionário/admin permanece no caminho atual e deve continuar coberto por testes de regressão.

## Fluxo de senha inicial

- Criar hash bcrypt com custo atual da aplicação.
- Gerar senha temporária aleatória criptograficamente segura no servidor.
- Exibir uma única vez à pessoa autorizada que está criando a conta; nunca salvar ou logar texto puro.
- Forçar `mustChangePassword` antes de liberar qualquer rota do portal.
- A troca exige senha atual/temporária e nova senha validada; invalidar sessões antigas após a troca.
- Não habilitar recuperação por e-mail até existir envio transacional, verificação de endereço e token de uso único com expiração.

## Ordem técnica para uma implementação segura

1. Confirmar estrutura e constraints reais do banco local/homologação por introspecção read-only.
2. Adicionar os modelos Prisma e migration SQL aditiva em branch separada.
3. Adicionar funções SQL de lookup de portal e revalidação, com grants mínimos à role runtime.
4. Adicionar tipo de principal à sessão sem alterar a autenticação atual de funcionários.
5. Implementar login de portal e fluxo de senha temporária/troca.
6. Persistir Student e StudentGuardian (substituir mocks dos formulários) e emitir credenciais por ação administrativa autorizada.
7. Criar dashboards com consultas reais e escopo derivado da sessão.
8. Testar em PostgreSQL descartável com duas escolas, alunos, responsáveis, vínculos cruzados inválidos, contas inativas e tentativas excessivas.
9. Só depois revisar e aplicar migration em homologação; produção exige aprovação e plano de rollback.

## Questões de produto a validar antes da migration

- Um responsável pode acessar filhos matriculados em escolas diferentes da mesma organização? E de organizações diferentes?
- A matrícula oficial é única por escola ou há outro identificador institucional?
- A secretaria pode emitir/visualizar senha temporária uma única vez? Quem tem essa permissão?
- O e-mail do responsável será verificado antes de habilitar recuperação de senha?

Até essas respostas serem confirmadas, manter o escopo inicial limitado a uma escola por conta de portal e não inventar suporte multi-escola.


## Verificação adicional da integração com o código atual (03/11/2026)

A inspeção do fluxo completo de sessão identificou dependências que precisam ser resolvidas antes de escrever a migration:

- `src/lib/session.ts` chama `isSessionStillValid(userId, organizationId, schoolId, role)` em toda sessão validada.
- `src/server/auth/membership-check.ts` revalida exclusivamente via `app_auth.membership_lookup(userId, schoolId)` e compara o papel calculado a partir de `user_role_assignments`. Um `PortalAccount.id` não é um `User.id`; passar um no outro invalidaria a sessão ou exigiria uma consulta incorreta.
- `src/server/db/tenant.ts` monta `app.current_user_id` com `session.id`. Portanto, trocar apenas o tipo de identidade sem definir como as políticas RLS reconhecem o principal do portal pode negar acesso ou, pior, ampliar acesso indevidamente.
- `src/server/auth/access.ts`, `src/lib/roles.ts`, `src/types/next-auth.d.ts`, `src/auth.config.ts` e o shell do dashboard também assumem um único conjunto de papéis e uma rota inicial por papel. A separação precisa atravessar middleware, sessão, guards e navegação, não só o provider Credentials.
- `src/app/(dashboard)/aluno/page.tsx` ainda importa `src/lib/mock/aluno`; o login não deve ser anunciado como pronto enquanto o painel não consultar o aluno autenticado.
- A árvore atual do GitHub contém `db/rls/demo/00-auth-subset.sql`, mas não o arquivo completo de políticas RLS referido em comentários e no histórico local. O próprio `prisma/schema.prisma` declara ser parcial. Não há, portanto, evidência suficiente no repositório remoto para gerar uma migration acadêmica/portal compatível com o banco real.

### Gate técnico antes da primeira alteração de banco

1. Recuperar e conferir a versão canônica do schema acadêmico e das políticas RLS que realmente correspondem ao banco de homologação/local.
2. Fazer introspecção somente leitura do PostgreSQL descartável/homologação e comparar tabelas, constraints, enums, funções, triggers e grants com o Prisma.
3. Definir formalmente o contrato RLS para STAFF, STUDENT e GUARDIAN, incluindo a identidade usada em `app.current_user_id` e as funções de lookup/revalidação.
4. Só então preparar migration aditiva e testes de integração em PostgreSQL descartável. Não executar `db push`, migration ou SQL no Supabase de produção nesta fase.

Esta verificação é um bloqueio de segurança, não uma mudança de escopo: os logins continuam sendo matrícula+senha para aluno e e-mail+senha para responsável, com o login administrativo preservado.


## Evidências recuperadas do pacote histórico enviado (03/11/2026)

O pacote contém `schema.prisma` (49 models e 18 enums), `rls-policies.sql`, `seed.ts`, `docker-compose.yml`, `001-create-runtime-role.sql`, relatórios das Fases 0, 1, 1.1 e 1.2, além de três arquivos de testes de integração. A contagem observada diretamente no arquivo é 49 models; alguns relatórios antigos citam 46, então a contagem deve ser corrigida/explicada antes de tratar o inventário como definitivo.

### Compatibilidade confirmada e lacunas

- O schema histórico inclui `Student`, `Guardian`, `StudentGuardian` e `Enrollment`, com a decisão aprovada de uma `Enrollment` por aluno/ano e percursos em `EnrollmentCurriculum`.
- `Student` histórico NÃO possui número oficial de matrícula nem relação direta com uma identidade de autenticação. `Guardian.email` é opcional; `Guardian.userId` é opcional e aponta para `User`. `StudentGuardian` liga estudante e responsável, mas não contém `schoolId` próprio nem regras de autenticação.
- O histórico não implementa portal de aluno/responsável. A seção 6.5 do `rls-policies.sql` exclui explicitamente `users`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `school_memberships`, `guardians`, `student_guardians` e `notifications` do RLS, reservando o desenho dessas tabelas para a Fase 2 (Auth + RBAC).
- O arquivo histórico protege 25 tabelas acadêmicas por RLS e contém 29 policies, 22 funções e 18 triggers. Essas proteções não equivalem a autorização de portal: não existe ainda regra RLS que traduza uma sessão de aluno em acesso ao próprio estudante, ou uma sessão de responsável em acesso aos alunos ligados.
- `001-create-runtime-role.sql` e `FASE1.2-RLS-OWNERSHIP.md` separam role de migração e runtime. O relatório declara expressamente que a validação real contra PostgreSQL não foi executada naquela fase; os testes foram escritos, mas não comprovam isolamento até serem executados.
- O schema histórico também não é automaticamente compatível com o `main`: o Prisma do `main` é um subconjunto de autenticação com nomes/campos/relações próprios, e `db/rls/demo/00-auth-subset.sql` é demonstrativo. O pacote histórico deve ser tratado como fonte de domínio candidata, não como migration pronta.

### Decisões de implementação que ficam adotadas para a próxima etapa

1. Manter `User`/`SchoolMembership`/`UserRoleAssignment` para equipe e administração; não converter aluno em usuário de equipe nem inventar e-mail para matrícula.
2. Introduzir identidade de portal separada, vinculada exatamente a um `Student` OU a um `Guardian`, com tipo discriminado, hash de senha, status, `mustChangePassword` e trilha de auditoria. A conta não poderá apontar simultaneamente para estudante e responsável.
3. Para aluno, o identificador será a matrícula oficial fornecida/confirmada pela escola; não gerar número fictício. A unicidade e a resolução no login precisam ser verificadas no escopo institucional. Se a matrícula não identificar uma única conta, falhar fechado e exigir desambiguação institucional, nunca escolher a primeira correspondência.
4. Para responsável, o identificador será e-mail normalizado e verificado, associado ao perfil `Guardian`; um responsável só acessará estudantes por vínculos `StudentGuardian` ativos.
5. A sessão terá principal discriminado (`STAFF`, `STUDENT`, `GUARDIAN`). Para portal, não reutilizar `PortalAccount.id` como `app.current_user_id`: esse setting hoje representa `User.id` e é usado, por exemplo, pela regra de atribuição docente. O contrato RLS do portal terá contexto próprio, validado em transação, e funções auxiliares que limitem estudante/responsável aos registros relacionados.
6. A conta de responsável será por organização, não duplicada por escola: o mesmo e-mail poderá acessar estudantes vinculados em escolas da mesma organização. A autorização continuará limitada a vínculos ativos. Não será permitido atravessar organizações.
7. A matrícula será procurada entre as escolas ativas da organização da plataforma; se houver colisão, o login falhará fechado. Uma futura tela de seleção/código de escola só será adicionada se a regra real da rede exigir esse desempate.
8. Provisionamento inicial por senha temporária aleatória, exibida uma única vez a operador autorizado; somente hash persistido; troca obrigatória no primeiro acesso. Recuperação por e-mail fica bloqueada até existir provedor transacional e verificação de endereço.

### Plano de implementação após a auditoria

- Primeiro reconciliar o schema histórico com o schema real de homologação/local e com as migrations do `main`; não copiar o arquivo histórico inteiro por cima.
- Implementar em branch isolada as entidades mínimas de matrícula oficial e conta de portal, a sessão discriminada, os lookups de autenticação/revalidação e as policies RLS próprias para aluno/responsável.
- Adaptar o cadastro administrativo para persistir `Student`, `Guardian` e `StudentGuardian`, com matrícula oficial inserida/confirmada pela escola e provisionamento seguro de conta.
- Implementar painéis com consultas reais filtradas pela identidade autenticada, substituindo os mocks antes de considerar os logins funcionais.
- Executar testes de integração PostgreSQL com pelo menos duas escolas, dois alunos, dois responsáveis e um responsável com mais de um estudante; testar SELECT e mutações proibidas, além de regressão do login administrativo.
- Não aplicar migrations, `db push` ou SQL no Supabase de produção nesta etapa.
