# Auditoria técnica e plano de implementação — AURA SYSTEM

Data da auditoria: 2026-11-02
Base analisada: branch `main`

## Estado confirmado

- O login e a sessão são reais, com Auth.js e validação do vínculo do usuário no banco.
- O contexto de tenant (`withTenant` / `withSession`) existe, mas o README registra que ainda não é utilizado pelas telas acadêmicas.
- As páginas acadêmicas — incluindo alunos, responsáveis, professores, matrículas, notas e frequência — ainda consomem funções em `src/lib/mock/`.
- O formulário de aluno usa `useMockSubmit`; portanto, não grava dados no PostgreSQL.
- O campo de número de matrícula no formulário está descrito como automático.
- `prisma/schema.prisma` declara explicitamente ser parcial e conter apenas os models de autenticação e alguns perfis.
- O helper `withSession` obtém organização e escola a partir da sessão validada, e configura o contexto de RLS dentro de uma transação.
- O status do commit de branding mais recente na `main` foi consultado e retornou sucesso de implantação da Vercel.

## Restrições de segurança

1. Não executar `prisma db push`, migrations, seeds, resets ou alterações SQL no banco conectado à produção durante a implementação inicial.
2. Não substituir o schema parcial por um schema acadêmico incompleto ou inferido a partir dos mocks.
3. Toda leitura e escrita acadêmica deve usar o contexto autenticado de tenant e a role de runtime; nunca aceitar `schoolId` ou `organizationId` livremente do formulário como autorização.
4. Não expor CPF completo nas telas nem trafegar documentos sensíveis sem necessidade e autorização.
5. Preservar histórico acadêmico: desativação lógica em vez de exclusão de alunos com matrículas.
6. O número oficial de matrícula deve ser informado/confirmado pela escola e armazenado como identificador oficial; não inventar um número governamental nem presumir integração com API pública.

## Sequência recomendada

### Etapa 1 — Consolidar o contrato de dados
- Recuperar e revisar a versão completa e aprovada do schema acadêmico e das políticas RLS, caso exista fora da branch principal.
- Conferir os modelos de Organization, School, Student, Guardian, StudentGuardian, AcademicYear, ClassGroup, Enrollment e EnrollmentCurriculum.
- Definir unicidade do número oficial de matrícula no escopo correto (no mínimo por escola, conforme regra institucional confirmada).
- Definir campos obrigatórios, estados, índices, chaves estrangeiras e política de retenção/histórico.
- Produzir migrations versionadas e revisão de segurança antes de qualquer aplicação em ambiente compartilhado.

### Etapa 2 — Preparar o módulo de alunos
- Criar validação server-side com Zod.
- Criar Server Actions/serviços para listar, consultar, cadastrar, editar e inativar alunos.
- Implementar filtros e paginação no servidor.
- Implementar vínculos com responsáveis e validação de responsável obrigatório para menores, com regra também no servidor.
- Exibir apenas documento mascarado; evitar armazenar CPF se não houver necessidade institucional definida.
- Substituir o campo automático por campo de matrícula oficial, com validação de formato e duplicidade conforme a regra aprovada.

### Etapa 3 — Testes e isolamento
- Testar permissões por papel.
- Testar leitura e escrita com duas escolas distintas, comprovando que uma não acessa dados da outra.
- Testar duplicidade de matrícula, validação, inativação e preservação de histórico.
- Executar typecheck, testes automatizados e build em ambiente isolado.

### Etapa 4 — Homologação
- Aplicar migrations somente em ambiente de homologação primeiro.
- Validar o fluxo com dados fictícios, nunca com dados pessoais reais de estudantes.
- Só planejar produção após backup, revisão das migrations, confirmação de variáveis e autorização explícita.

## Critério para considerar o módulo de alunos real

O módulo só será considerado implementado quando cadastro, edição, consulta, filtros e inativação persistirem no banco real, forem autorizados pelo tenant da sessão, respeitarem a matrícula oficial e passarem nos testes de isolamento entre escolas. A interface, isoladamente, não conta como conclusão.
