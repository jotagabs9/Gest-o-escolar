# Plano de implementação — login de alunos e responsáveis

## Decisão de produto
- Aluno: **número oficial de matrícula + senha**.
- Responsável: **e-mail cadastrado + senha**.
- Login do administrador permanece inalterado.
- Login de professor fica fora deste escopo.
- Não criar novos perfis administrativos agora.

## Estado real encontrado no código (main)
1. `src/auth.ts` aceita apenas `email` e `password` e consulta `app_auth.login_lookup(email)`.
2. `src/server/auth/roles.ts` mapeia ALUNO e RESPONSAVEL para o mesmo papel `STUDENT_GUARDIAN`.
3. `src/types/auth.ts` não possui papéis separados para aluno e responsável.
4. `src/app/(dashboard)/aluno/layout.tsx` protege a área com o papel compartilhado.
5. `src/app/(dashboard)/aluno/page.tsx` usa `src/lib/mock/aluno`, não dados vinculados à sessão.
6. `prisma/schema.prisma` é explicitamente parcial: contém Guardian, mas não Student, StudentGuardian nem Enrollment.
7. `src/components/people/student-form.tsx` e `guardian-form.tsx` usam `useMockSubmit`; cadastros e vínculos ainda não persistem no banco.
8. O formulário diz que a matrícula será gerada automaticamente, mas a decisão do produto é armazenar o número oficial informado pela escola.
9. O schema atual exige `User.email` único e não nulo. Isso precisa ser considerado para alunos que entram por matrícula, sem inventar e-mail.

## Arquitetura recomendada

### Identidades e autorização
- Separar os papéis da aplicação em `STUDENT` e `GUARDIAN`; manter `SCHOOL_ADMIN` exatamente como está.
- Professor continua com seu fluxo atual e não será alterado nesta entrega.
- A credencial de aluno deve resolver matrícula **dentro da escola/tenant**, nunca globalmente.
- A credencial de responsável deve resolver e-mail normalizado e verificar seu vínculo ativo com pelo menos um aluno naquela escola.
- Não escolher silenciosamente uma escola quando o identificador estiver associado a mais de uma escola: exigir contexto inequívoco.
- Não devolver hashes, documentos pessoais ou dados de outros alunos nas funções de autenticação.

### Relações de domínio necessárias
- Student persistido, com matrícula oficial e vínculo escolar.
- Guardian persistido.
- Relação N:N StudentGuardian, com parentesco e responsável principal.
- Credencial de acesso ligada à identidade e ao escopo escolar correto.
- Unicidade da matrícula por escola; regra de unicidade de e-mail definida sem quebrar organizações distintas.

A modelagem definitiva deve ser reconciliada com o schema acadêmico histórico e validada em PostgreSQL isolado antes de tocar produção. Não copiar o schema histórico inteiro nem aplicar suas políticas RLS antigas.

### Senha inicial e recuperação
Não há provedor de e-mail transacional configurado no repositório. Para a primeira versão:
1. A escola/admin emite senha temporária aleatória para cada conta.
2. Apenas o hash é armazenado; a senha temporária é exibida uma única vez em fluxo administrativo autorizado.
3. A conta recebe `mustChangePassword = true` (ou mecanismo equivalente).
4. No primeiro login, a pessoa deve definir senha própria antes de acessar dados.
5. A senha nunca é enviada em texto puro por e-mail, log, URL ou exibida novamente.
6. “Esqueci minha senha” por e-mail só será habilitado após configurar provedor de envio e verificação de endereço.

O mecanismo de emissão de senha temporária e troca obrigatória deve existir antes de disponibilizar contas reais.

## Requisitos de segurança obrigatórios
- Rate limit para matrícula e e-mail, com chave normalizada e resistente a enumeração.
- Erros genéricos (não revelar se matrícula/e-mail existe).
- Verificar conta ativa, vínculo escolar ativo e matrícula vigente.
- RLS e consultas server-side limitando aluno ao próprio registro e responsável somente aos alunos vinculados.
- Responsável pode ter vários alunos; aluno não vê dados de irmãos automaticamente.
- Professor e administrador não recebem mudanças neste escopo.
- Não usar mocks como prova de autenticação/autorização.
- Testes negativos: matrícula de outra escola, responsável sem vínculo, vínculo removido, conta inativa, aluno tentando área de responsável e vice-versa, tentativas excessivas.

## Plano de entrega
1. Modelagem isolada: Student, Guardian, StudentGuardian, credenciais e matrícula oficial; reconciliar com schema histórico.
2. Autenticação: lookup seguro para dois identificadores e papéis separados, sem alterar login admin.
3. Primeiro acesso: senha temporária e troca obrigatória.
4. Autorização/dados: dashboards separados e consultas reais limitadas ao próprio aluno ou aos alunos vinculados.
5. Testes: PostgreSQL descartável com duas escolas fictícias e testes de isolamento/abuso.
6. Homologação: revisar diff, CI, migração e rollback; só então avaliar implantação.

## Limites desta etapa
Este documento não altera schema Prisma, SQL, credenciais, dados ou Supabase. Não habilita logins reais. A implementação só estará pronta quando cadastros deixarem de ser mocks e relações e testes de isolamento estiverem implementados.
