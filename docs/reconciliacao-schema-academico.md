# Reconciliação do schema acadêmico — AURA SYSTEM

## Objetivo

Preparar a recuperação do domínio acadêmico histórico sem substituir o schema de autenticação atual nem executar alterações no banco conectado à produção.

## Fontes comparadas

- `prisma/schema.prisma` da branch `main`: schema parcial, com 8 models (Organization, School, User, SchoolMembership, Role, UserRoleAssignment, Teacher e Guardian).
- Pacote histórico `projeto-gestao-escolar2.0(3).zip`: schema Prisma com 46 models, SQL de RLS, testes de integração e relatórios das fases 0, 1, 1.1 e 1.2.
- Implementação atual de sessão: `src/server/auth/roles.ts`, `src/server/db/tenant-settings.ts`, helper de tenant e SQL de autenticação em `db/auth/001_auth_lookup.sql`.
- SQL atual em `db/rls/demo/00-auth-subset.sql`: explicitamente identificado como subconjunto demonstrativo, não como o RLS acadêmico completo.

## Decisões arquiteturais históricas que devem ser preservadas até revisão formal

1. **Matrícula por ano letivo:** cada rematrícula cria uma nova Enrollment; não sobrescrever a matrícula anterior.
2. **Matrícula geral e técnica:** usar Enrollment + EnrollmentCurriculum para representar múltiplos vínculos curriculares do mesmo ano, evitando matrículas independentes duplicadas.
3. **Histórico imutável:** não apagar matrículas, notas, frequência e documentos oficiais; usar estados, encerramento e trilha de auditoria.
4. **Calendário flexível:** AcademicYear + AcademicPeriod configuráveis por escola, sem presumir sempre quatro bimestres.
5. **Frequência por aula:** LessonRecord + AttendanceRecord, com percentual derivado dos registros e do calendário letivo.
6. **Currículo versionado:** alterações estruturais em currículos ativos geram nova versão, preservando a matriz que o aluno cursou.
7. **Multi-tenancy:** banco compartilhado com isolamento por organização/escola e PostgreSQL RLS, além de autorização na aplicação.
8. **Escopo docente:** role do usuário não basta; atribuição do professor à turma/componente/período também deve limitar notas e frequência.

## Bloqueios identificados nos relatórios históricos

- O relatório final histórico da Fase 1 registra que os testes de integração contra PostgreSQL real **não foram executados**. Portanto, os resultados estáticos não provam isolamento de dados em execução.
- A revisão histórica de hardening identificou um bloqueio sobre ownership/RLS: tabela pertencente à mesma role usada pela aplicação pode ignorar policies, salvo configuração apropriada. A recomendação histórica foi separar a role de runtime da role de migração.
- A revisão também apontou que a regra de escopo docente precisa ser RESTRICTIVE para restringir policies permissivas, e que INSERT/UPDATE/DELETE precisam ter tratamento explícito.
- O próprio relatório histórico deixou decisões operacionais e de produto pendentes. Não tratar o pacote como aprovado para produção.

## Divergências que exigem reconciliação antes de importar o schema

- O schema atual de autenticação usa nomes e enums de roles da aplicação diferentes dos nomes históricos do RBAC acadêmico. O mapeamento atual reconhece SCHOOL_ADMIN, TEACHER e STUDENT_GUARDIAN; não importar enums/roles antigos sem uma tabela de compatibilidade.
- O contexto atual de tenant é construído a partir da sessão autenticada e usa os settings `app.current_org_id`, `app.current_school_ids` e `app.current_user_id`. Qualquer policy histórica precisa usar exatamente o contrato confirmado ou ser adaptada e testada.
- O SQL de autenticação atual concede execução à role `school_saas_runtime`; confirmar no ambiente local/homologação a existência, atributos e grants dessa role antes de adotar o modelo histórico de ownership.
- O SQL `db/rls/demo/00-auth-subset.sql` cobre somente as tabelas do schema parcial e não pode ser combinado cegamente com o SQL acadêmico histórico.
- O histórico contém decisões de domínio e testes, mas precisa ser comparado com o código de UI, os tipos e as ações atuais antes de criar modelos/rotas.

## Plano técnico seguro

### A. Reconciliar modelos (sem alterar banco)
- Gerar inventário de models/enums/relations do schema histórico e atual.
- Mapear cada model histórico para as páginas/funcionalidades atuais e marcar: reaproveitar, adaptar, adiar ou descartar.
- Reconciliar User/Role/Teacher/Guardian com autenticação e sessão atuais.
- Validar explicitamente Student, StudentGuardian, AcademicYear, AcademicPeriod, Course, Curriculum, CurriculumComponent, ClassGroup, Enrollment e EnrollmentCurriculum.
- Definir matrícula oficial como valor fornecido/confirmado pela escola; unicidade por escola e regra de formato precisam de confirmação institucional. Não gerar número governamental fictício.

### B. Reconciliar segurança
- Revisar todas as policies, funções, triggers, ownership, roles, GRANTs e FORCE RLS do SQL histórico.
- Confirmar que as consultas da aplicação usam a role de runtime e contexto SET LOCAL dentro de transação.
- Executar testes de duas escolas com dados fictícios em PostgreSQL isolado; verificar SELECT, INSERT, UPDATE e DELETE por papel.
- Não aprovar produção apenas com testes estáticos ou mocks.

### C. Só então implementar alunos
- Especificar campos mínimos e tratamento de dados pessoais/LGPD.
- Implementar validação server-side, serviços/Server Actions, listagem paginada, detalhe, criação, edição e inativação.
- Toda operação deriva organização/escola da sessão, nunca de um schoolId confiado ao formulário.
- Preservar histórico: inativação em vez de exclusão física quando houver vínculos acadêmicos.
- Testar duplicidade da matrícula oficial e isolamento entre escolas.

## Ações deliberadamente não realizadas

- Nenhuma alteração em `prisma/schema.prisma`.
- Nenhuma migration ou `prisma db push`.
- Nenhum SQL executado no Supabase.
- Nenhuma alteração em variáveis/credenciais.
- Nenhum dado pessoal real foi utilizado.

## Critério de saída desta etapa

A reconciliação estará pronta quando houver um schema candidato revisado, um mapa de compatibilidade com a autenticação atual, uma proposta de migrations versionadas e uma suíte de testes RLS executável em banco isolado. Só então abrir a implementação funcional do módulo de alunos.
