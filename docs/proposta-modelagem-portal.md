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
