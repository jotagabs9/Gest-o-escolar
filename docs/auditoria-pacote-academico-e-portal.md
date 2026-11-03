# Auditoria do pacote acadêmico histórico e integração com o portal

**Data:** 03/11/2026  
**Escopo:** análise estática dos arquivos recebidos em `projeto-gestao-escolar2.0 (1).zip`, comparados com a implementação atual da branch `main`.  
**Status:** diagnóstico concluído; implementação de autenticação ainda bloqueada por validação real do PostgreSQL/RLS.

## 1. Inventário confirmado do ZIP

O pacote contém 20 arquivos, incluindo:
- `schema.prisma` (42.645 bytes);
- `rls-policies.sql` (41.201 bytes);
- `docker-compose.yml` e `001-create-runtime-role.sql`;
- `seed.ts`;
- testes `enrollment-curriculum.integration.test.ts`, `fase1-1-hardening.integration.test.ts` e `role-isolation.integration.test.ts`;
- relatórios das Fases 0, 1, 1.1 e 1.2, README, bootstrap e validação local.

**Contagem extraída diretamente do arquivo:** 49 models e 18 enums. Há relatórios no próprio pacote que ainda mencionam 46 models; portanto, os números dos relatórios não devem ser usados como inventário atual sem reconferência.

## 2. O que o schema acadêmico já oferece

- `Student` contém escola, nome, documento opcional, data de nascimento e anonimização.
- `Guardian` contém nome, telefone, e-mail opcional e `userId` opcional para relacionar com `User`.
- `StudentGuardian` cria o vínculo N:N entre aluno e responsável.
- `Enrollment` registra aluno, escola, ano letivo, turma, status e datas.
- O restante do domínio cobre currículo, componentes, avaliações, notas, frequência, documentos, transferências e trilhas técnicas.

### Lacunas relevantes para os requisitos atuais

1. **Matrícula oficial:** não há campo de matrícula em `Student` nem constraint de unicidade por escola. O campo `documentNumber` não deve ser reaproveitado: documento pessoal e matrícula escolar são identificadores diferentes.
2. **Login do aluno:** `Student` não possui senha, hash, e-mail nem relação com uma identidade de autenticação.
3. **Login do responsável:** o schema prevê `Guardian.userId` opcional apontando para `User`, mas `Guardian.email` também é opcional e não há constraint que garanta e-mail verificado, identidade ativa ou membership no escopo escolar.
4. **Vínculo multi-escola:** `StudentGuardian` liga diretamente estudante e responsável, mas não inclui `schoolId` ou `organizationId`. O isolamento precisa ser garantido por relações/constraints e policies, não presumido.
5. **Provisionamento:** não há no schema um fluxo de convite, senha temporária, troca obrigatória ou recuperação de senha para identidades do portal.

## 3. Diferenças de arquitetura em relação à aplicação atual

A aplicação atual foi construída em torno de `User`, `SchoolMembership` e `UserRoleAssignment`. O schema histórico também tem esses modelos, mas isso **não prova compatibilidade de colunas, constraints, enums, índices, ownership ou dados** com o PostgreSQL conectado à produção.

O fluxo atual de sessão revalida a identidade por `app_auth.membership_lookup` e `membership_lookup(userId, schoolId)`. O contexto de tenant usa o ID da sessão como `app.current_user_id`. Portanto:

- Não se pode passar um `Student.id` ou `PortalAccount.id` como se fosse `User.id`.
- A autenticação de aluno exige uma decisão explícita sobre principal da sessão e lookup de matrícula por escola.
- O responsável pode potencialmente usar `User` existente via `Guardian.userId`, mas precisa de vínculo escolar ativo, normalização/validação de e-mail e autorização restrita aos alunos relacionados.
- A sessão, middleware, guards, rota inicial, revalidação e RLS precisam reconhecer corretamente cada tipo de principal. Alterar somente o formulário ou o Credentials provider seria incompleto.

## 4. RLS e hardening: o que foi e não foi comprovado

O pacote contém SQL substancial de RLS, funções, triggers e testes de isolamento. Os relatórios descrevem correções importantes de policies permissivas/restritivas, escopo docente, integridade entre entidades acadêmicas e separação entre role migrator e runtime.

Entretanto, o próprio `RELATORIO-FASE1-FINAL.md` declara explicitamente:
- os 10 cenários acadêmicos e 12 cenários de hardening não foram executados contra PostgreSQL real;
- os resultados apresentados são validações estáticas;
- a Fase 1 permanece **NÃO APROVADA** até a execução real;
- a separação entre `school_saas_migrator` e `school_saas_runtime` é essencial, e os testes de RLS devem executar com role não-owner;
- a Fase 1.2 também não foi validada empiricamente.

Logo, não é correto descrever o RLS histórico como comprovadamente seguro em execução ou aplicá-lo à produção sem reconciliação.

## 5. Decisão de implementação recomendada

Adotar uma implementação por etapas, sem copiar o schema histórico integral e sem introduzir credenciais de aluno em `User.email`:

### Etapa A — reconciliação read-only
- Obter snapshot/dump de homologação ou banco local isolado que represente o estado atual.
- Comparar `information_schema`, constraints, índices, enums, funções, triggers, grants, owners e policies com o schema e SQL históricos.
- Validar `DATABASE_URL` de migration e `RUNTIME_DATABASE_URL` da aplicação; runtime deve ser role sem ownership, sem superuser e sem BYPASSRLS.

### Etapa B — identidade e escopo
- Preservar o login administrativo existente.
- Escolher e documentar o principal de aluno (identidade separada ou extensão formal do modelo de identidade), incluindo login por matrícula normalizada e escopo escolar.
- Para responsáveis, preferir vínculo explícito com uma identidade autenticável e membership/escopo autorizado; não confiar apenas no e-mail salvo no perfil.
- Definir se o responsável verá filhos em escolas diferentes da mesma organização. Até decisão institucional, restringir ao escopo autorizado e nunca inferir acesso só por parentesco declarado.
- Definir a política de matrícula: formato, quem atribui, se pode repetir em escolas diferentes e regra de rematrícula. A proposta atual é unicidade por escola, mas isso requer confirmação institucional antes de constraint definitiva.

### Etapa C — código e testes isolados
- Criar migration aditiva e SQL de RLS adaptado, em branch separada.
- Cobrir criação/provisionamento, troca obrigatória de senha, login por matrícula, login por e-mail, desativação e revogação.
- Testar aluno A não acessando aluno B; responsável A não acessando aluno sem vínculo; responsável com dois filhos acessando apenas os dois; escola A não acessando escola B; admin preservando fluxo atual.
- Executar os testes com PostgreSQL real, usando role runtime não-owner para as verificações de RLS.
- Só depois integrar painéis com dados persistidos e remover mocks correspondentes.

## 6. Proteções mantidas

Até a validação acima:
- nenhuma migration aplicada ao Supabase;
- nenhum `prisma db push` contra produção;
- nenhum SQL histórico aplicado;
- nenhum dado real de estudante/responsável usado em teste;
- nenhum segredo ou senha adicionado ao repositório;
- nenhum ajuste no login administrativo.

## 7. Critério para avançar

O próximo passo técnico seguro é montar/usar um PostgreSQL descartável com o `docker-compose.yml` do pacote e executar o bootstrap, migrations e testes documentados. Se o ambiente local atual já tem Docker e o container `gestao-escolar-db`, ele deve ser inspecionado antes de qualquer reset: **não apagar volumes nem reutilizar dados sem backup**.

A implementação do portal começa depois de confirmar que o schema histórico pode ser instalado e que o runtime está realmente sujeito ao RLS. Isso evita entregar uma tela de login que autentica, mas não protege dados acadêmicos.
