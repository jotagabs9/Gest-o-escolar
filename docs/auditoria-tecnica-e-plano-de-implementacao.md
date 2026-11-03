# Auditoria técnica e plano de implementação — AURA SYSTEM

Data da auditoria: 2026-11-02
Base analisada: branch `main` e artefatos históricos recuperados da Library.

## Estado confirmado no repositório atual

- O login e a sessão são reais, com Auth.js e validação do vínculo do usuário no banco.
- O contexto de tenant (`withTenant` / `withSession`) existe, mas o README registra que ainda não é utilizado pelas telas acadêmicas.
- As páginas acadêmicas — incluindo alunos, responsáveis, professores, matrículas, notas e frequência — ainda consomem funções em `src/lib/mock/`.
- O formulário de aluno usa `useMockSubmit`; portanto, não grava dados no PostgreSQL.
- O campo de número de matrícula no formulário está descrito como automático.
- `prisma/schema.prisma` declara explicitamente ser parcial e conter apenas os models de autenticação e alguns perfis.
- O helper `withSession` obtém organização e escola a partir da sessão validada, e configura o contexto de RLS dentro de uma transação.
- A branch `main` contém somente o subconjunto demonstrativo de RLS em `db/rls/demo/00-auth-subset.sql`; o arquivo completo de políticas não está versionado na árvore atual do repositório.
- O status do commit de branding mais recente na `main` foi consultado e retornou sucesso de implantação da Vercel.

## Artefatos históricos recuperados

Foi localizado o arquivo `projeto-gestao-escolar2.0(3).zip` na Library, contendo:
- `schema.prisma` histórico (46 models, aproximadamente 42 KB);
- `rls-policies.sql` histórico (aproximadamente 41 KB);
- PRD, decisões arquiteturais, relatórios de Fase 1/1.1/1.2 e testes de integração de Enrollment/EnrollmentCurriculum.

Esses arquivos preservam decisões importantes, especialmente a separação entre `Enrollment` e `EnrollmentCurriculum`, mas **não devem ser copiados diretamente para a branch atual**: são artefatos históricos de setembro e precisam ser reconciliados com a implementação atual de autenticação, nomes de roles, tabelas já existentes e estado do banco local/produção.

O relatório histórico da Fase 1 declara explicitamente **NÃO APROVADA** porque os testes de integração e as migrations não foram executados contra um PostgreSQL real. A existência de testes escritos e auditoria estática não equivale a validação empírica do RLS.

## Restrições de segurança

1. Não executar `prisma db push`, migrations, seeds, resets ou alterações SQL no banco conectado à produção durante a implementação inicial.
2. Não substituir o schema parcial por um schema acadêmico incompleto ou inferido a partir dos mocks.
3. Não tratar os artefatos históricos como aprovados para produção; reconciliar e validar antes de adotá-los.
4. Toda leitura e escrita acadêmica deve usar o contexto autenticado de tenant e a role de runtime; nunca aceitar `schoolId` ou `organizationId` livremente do formulário como autorização.
5. Não expor CPF completo nas telas nem trafegar documentos sensíveis sem necessidade e autorização.
6. Preservar histórico acadêmico: desativação lógica em vez de exclusão de alunos com matrículas.
7. O número oficial de matrícula deve ser informado/confirmado pela escola e armazenado como identificador oficial; não inventar um número governamental nem presumir integração com API pública.

## Sequência recomendada

### Etapa 1 — Reconciliar o contrato de dados
- Comparar o schema histórico de 46 models com o schema atual de autenticação.
- Comparar as políticas históricas com `db/rls/demo/00-auth-subset.sql`, `db/auth/001_auth_lookup.sql`, `src/server/auth/roles.ts` e `src/server/db/tenant-settings.ts`.
- Conferir os modelos de Organization, School, Student, Guardian, StudentGuardian, AcademicYear, ClassGroup, Enrollment e EnrollmentCurriculum.
- Preservar a decisão arquitetural de `Enrollment` + `EnrollmentCurriculum`; não simplificar para dois registros de matrícula independentes.
- Definir unicidade do número oficial de matrícula no escopo correto (no mínimo por escola, conforme regra institucional confirmada).
- Documentar divergências e propor migrations versionadas, sem aplicá-las.

### Etapa 2 — Validar a camada de banco em ambiente isolado
- Recuperar o SQL completo histórico e revisar ownership, roles, GRANTs, FORCE ROW LEVEL SECURITY, policies, triggers e funções.
- Confirmar que a aplicação usa exclusivamente a role de runtime, nunca a role de migração.
- Executar os testes de isolamento com duas escolas distintas em PostgreSQL local/homologação.
- Obter evidência real de que as policies bloqueiam acesso cruzado; a Fase 1 histórica não tinha essa validação empírica.

### Etapa 3 — Preparar o módulo de alunos
- Criar validação server-side com Zod.
- Criar Server Actions/serviços para listar, consultar, cadastrar, editar e inativar alunos.
- Implementar filtros e paginação no servidor.
- Implementar vínculos com responsáveis e validação de responsável obrigatório para menores, com regra também no servidor.
- Exibir apenas documento mascarado; evitar armazenar CPF se não houver necessidade institucional definida.
- Substituir o campo automático por campo de matrícula oficial, com validação de formato e duplicidade conforme a regra aprovada.

### Etapa 4 — Testes e homologação
- Testar permissões por papel, duplicidade de matrícula, validação, inativação e preservação de histórico.
- Executar typecheck, testes automatizados e build em ambiente isolado.
- Aplicar migrations somente em homologação primeiro.
- Validar o fluxo com dados fictícios, nunca com dados pessoais reais de estudantes.
- Só planejar produção após backup, revisão das migrations, confirmação de variáveis e autorização explícita.

## Critério para considerar o módulo de alunos real

O módulo só será considerado implementado quando cadastro, edição, consulta, filtros e inativação persistirem no banco, forem autorizados pelo tenant da sessão, respeitarem a matrícula oficial e passarem nos testes de isolamento entre escolas. A interface, isoladamente, não conta como conclusão.
