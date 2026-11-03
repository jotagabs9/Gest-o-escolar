# Reconciliação do schema acadêmico — AURA SYSTEM

## Objetivo

Preparar a recuperação do domínio acadêmico histórico sem substituir o schema de autenticação atual nem executar alterações no banco conectado à produção.

## Fontes comparadas

- `prisma/schema.prisma` da branch `main`: schema parcial com 8 models (Organization, School, User, SchoolMembership, Role, UserRoleAssignment, Teacher e Guardian).
- Pacote histórico `projeto-gestao-escolar2.0(3).zip`: schema Prisma com 46 models, SQL de RLS, testes de integração e relatórios das fases 0, 1, 1.1 e 1.2.
- Implementação atual de sessão: `src/server/auth/roles.ts`, `src/server/db/tenant-settings.ts`, helper de tenant e SQL de autenticação em `db/auth/001_auth_lookup.sql`.
- SQL atual em `db/rls/demo/00-auth-subset.sql`: explicitamente identificado como subconjunto demonstrativo, não como o RLS acadêmico completo.

## Inventário do domínio histórico

Os 46 models estão agrupados assim:

- **Identidade e RBAC:** Organization, School, User, SchoolMembership, Role, Permission, RolePermission, UserRoleAssignment.
- **Calendário e organização escolar:** AcademicYear, AcademicPeriod, CalendarEvent, EducationModality, EducationModalityYear, EducationStage, TechnologicalAxis, ClassGroup.
- **Cursos e currículo:** Course, PromotionRule, KnowledgeArea, Subject, Curriculum, AssessmentRule, CurriculumComponent, ProfessionalProfile, CompletionRequirement.
- **Pessoas e vínculos:** Student, Guardian, StudentGuardian, Teacher, TeacherAssignment.
- **Matrícula e histórico:** Enrollment, EnrollmentCurriculumRole, EnrollmentCurriculum, Transfer, EnrollmentDocument.
- **Vida acadêmica:** Assessment, Grade, LessonRecord, AttendanceRecord, Workload, StudentElectiveEnrollment.
- **Formação técnica e conclusão:** Internship, Competency, ComponentCompetency, TechnicalProject, TechnicalProjectStudent, Certificate.
- **Operação:** AuditLog, Notification.

O domínio acadêmico acrescenta 38 models ao subconjunto atual. Isso é uma expansão estrutural relevante, não uma alteração pequena de formulário.

## Compatibilidade inicial: modelos já existentes

| Model | Situação atual vs. histórico | Decisão |
|---|---|---|
| Organization | Campos centrais compatíveis; histórico acrescenta relação com cursos e auditoria | Preservar tabela e acrescentar relações/modelos após validação |
| School | Campos centrais compatíveis; nomes de relações Prisma diferem | Preservar colunas; revisar FKs e políticas |
| User | Campos centrais compatíveis; histórico acrescenta relação com AuditLog | Preservar identidade e credenciais; não recriar usuários |
| SchoolMembership | Estrutura central de userId/schoolId/isActive compatível; confirmar timestamps/índices no banco real | Não recriar vínculos; reconciliar constraints |
| Role | Histórico acrescenta Permission e RolePermission | Expandir RBAC com migração aditiva, sem renomear roles atuais |
| UserRoleAssignment | Conceito e campos centrais compatíveis | Preservar atribuições; validar scopes e regras |
| Teacher | Campos centrais compatíveis; histórico acrescenta TeacherAssignment | Preservar perfil e acrescentar atribuições acadêmicas |
| Guardian | Campos centrais compatíveis; histórico acrescenta StudentGuardian | Preservar perfil e criar vínculo explícito com aluno |

**Importante:** compatibilidade conceitual não prova que o banco de produção está no mesmo estado do schema do Git. Antes de migration, comparar `information_schema`, constraints, índices e dados reais em um dump/homologação. Nenhuma migration de renomeação ou recriação dessas tabelas deve ser gerada por suposição.

## Modelos acadêmicos a introduzir

A expansão inicial de domínio exige, no mínimo, Student, StudentGuardian, AcademicYear, AcademicPeriod, Course, Curriculum, CurriculumComponent, ClassGroup, Enrollment e EnrollmentCurriculum. O pacote também prevê calendário, componentes, notas, frequência, transferências, documentos, estágios, certificados e trilhas de formação técnica.

A implementação deve ser faseada: o cadastro de aluno não precisa liberar de imediato todos os modelos de notas, certificados ou projetos técnicos. Criar primeiro as entidades e relações mínimas necessárias ao fluxo de aluno/matrícula, com migrations pequenas e revisáveis.

## Decisões arquiteturais históricas a preservar até revisão formal

1. **Matrícula por ano letivo:** cada rematrícula cria uma nova Enrollment; não sobrescrever a matrícula anterior.
2. **Matrícula geral e técnica:** usar Enrollment + EnrollmentCurriculum para representar múltiplos vínculos curriculares do mesmo ano, evitando matrículas independentes duplicadas.
3. **Histórico imutável:** não apagar matrículas, notas, frequência e documentos oficiais; usar estados, encerramento e trilha de auditoria.
4. **Calendário flexível:** AcademicYear + AcademicPeriod configuráveis por escola, sem presumir sempre quatro bimestres.
5. **Frequência por aula:** LessonRecord + AttendanceRecord, com percentual derivado dos registros e do calendário letivo.
6. **Currículo versionado:** alterações estruturais em currículos ativos geram nova versão, preservando a matriz que o aluno cursou.
7. **Multi-tenancy:** banco compartilhado com isolamento por organização/escola e PostgreSQL RLS, além de autorização na aplicação.
8. **Escopo docente:** role do usuário não basta; atribuição do professor à turma/componente/período também deve limitar notas e frequência.

## Auditoria estática do SQL RLS histórico

O arquivo histórico contém:

- 29 declarações de policy;
- 22 funções PostgreSQL;
- 18 triggers;
- RLS habilitado em 25 tabelas;
- proteção FORCE RLS aplicada dinamicamente a essas tabelas por um bloco DO.

Há políticas específicas de isolamento por escola, além de verificações de escopo docente para INSERT/UPDATE de notas e frequência. As funções/triggers também verificam consistência entre turma, currículo, matrícula, componente e atribuição docente; preservam alterações estruturais de currículos e impedem exclusão de documentos oficiais e mutação de auditoria.

### Ponto crítico de ownership

O SQL histórico distingue `school_saas_migrator` e `school_saas_runtime`. O próprio relatório explica que FORCE RLS não protege contra superuser; o isolamento depende de a aplicação nunca usar a role de migração. O script histórico de bootstrap cria a role de runtime, mas o SQL de autenticação atual também concede EXECUTE a `school_saas_runtime`.

Antes de usar o SQL histórico, é necessário comparar:
- roles e atributos reais no PostgreSQL local e de homologação;
- owner de cada tabela;
- grants/default privileges;
- URL de conexão efetivamente usada pelo Prisma em runtime;
- policies existentes e funções auxiliares;
- uso transacional de `set_config(..., true)` para `app.current_org_id`, `app.current_school_ids` e `app.current_user_id`.

Não aplicar o SQL histórico integral em produção. Ele contém DDL, GRANTs, funções, triggers e políticas, e foi escrito para o schema histórico completo.

## Bloqueios identificados nos relatórios históricos

- O relatório final histórico da Fase 1 registra que os testes de integração contra PostgreSQL real **não foram executados**. Portanto, os resultados estáticos não provam isolamento de dados em execução.
- A revisão de hardening identificou o risco de ownership/RLS e adotou roles separadas de migração e runtime.
- A revisão também apontou que a regra de escopo docente precisa restringir policies permissivas e que INSERT/UPDATE/DELETE precisam de tratamento explícito.
- O próprio relatório histórico deixou decisões operacionais e de produto pendentes. Não tratar o pacote como aprovado para produção.

## Divergências que exigem reconciliação antes de importar o schema

- O schema atual de autenticação usa nomes e enums de roles da aplicação diferentes dos nomes históricos do RBAC acadêmico. O mapeamento atual reconhece SCHOOL_ADMIN, TEACHER e STUDENT_GUARDIAN; não importar enums/roles antigos sem uma tabela de compatibilidade.
- O contexto atual de tenant é construído a partir da sessão autenticada e usa os settings `app.current_org_id`, `app.current_school_ids` e `app.current_user_id`. Qualquer policy histórica precisa usar exatamente o contrato confirmado ou ser adaptada e testada.
- O SQL de autenticação atual concede execução à role `school_saas_runtime`; confirmar no ambiente local/homologação a existência, atributos e grants dessa role antes de adotar o modelo histórico de ownership.
- O SQL `db/rls/demo/00-auth-subset.sql` cobre somente tabelas do schema parcial e não pode ser combinado cegamente com o SQL acadêmico histórico.
- O schema histórico possui `EnrollmentCurriculumRole` como tabela extensível, não enum. Preservar essa decisão se ela ainda corresponder à regra de negócio aprovada.
- O número oficial de matrícula não existe no modelo histórico como um identificador governamental integrado. Deve ser definido como campo fornecido/confirmado pela escola, com unicidade por escola após confirmação da regra institucional. Não gerar número oficial fictício nem presumir API pública.

## Plano técnico seguro

### A. Reconciliar modelos (sem alterar banco)
- Comparar o schema histórico com o banco real por dump/snapshot de homologação.
- Mapear cada model histórico para as páginas/funcionalidades atuais e marcar: reaproveitar, adaptar, adiar ou descartar.
- Reconciliar User/Role/Teacher/Guardian com autenticação e sessão atuais.
- Definir campos mínimos de Student e StudentGuardian, incluindo tratamento de documentos e dados de menores.
- Definir a regra institucional do número oficial de matrícula e sua unicidade.
- Gerar schema candidato e migrations aditivas, sem aplicá-las.

### B. Reconciliar segurança
- Revisar policies, funções, triggers, ownership, roles, GRANTs e FORCE RLS do SQL histórico.
- Confirmar que as consultas da aplicação usam a role de runtime e contexto transacional SET LOCAL.
- Executar testes de duas escolas com dados fictícios em PostgreSQL isolado; verificar SELECT, INSERT, UPDATE e DELETE por papel.
- Testar também o isolamento de professores por atribuição à turma/componente.
- Não aprovar produção apenas com testes estáticos ou mocks.

### C. Só então implementar alunos
- Implementar validação server-side, serviços/Server Actions, listagem paginada, detalhe, criação, edição e inativação.
- Toda operação deriva organização/escola da sessão, nunca de um schoolId confiado ao formulário.
- Preservar histórico: inativação em vez de exclusão física quando houver vínculos acadêmicos.
- Testar duplicidade da matrícula oficial, validação de responsáveis e isolamento entre escolas.

## Ações deliberadamente não realizadas

- Nenhuma alteração em `prisma/schema.prisma`.
- Nenhuma migration ou `prisma db push`.
- Nenhum SQL executado no Supabase.
- Nenhuma alteração em variáveis/credenciais.
- Nenhum dado pessoal real foi utilizado.

## Critério de saída desta etapa

A reconciliação estará pronta quando houver um schema candidato revisado, um mapa de compatibilidade com a autenticação atual, uma proposta de migrations versionadas e uma suíte de testes RLS executável em banco isolado. Só então abrir a implementação funcional do módulo de alunos.
