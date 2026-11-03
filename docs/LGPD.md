# Avaliação técnica de privacidade e LGPD — AURA SYSTEM

**Escopo:** leitura estática do repositório `jotagabs9/Gest-o-escolar` na branch `main`, em 3 de novembro de 2026.  
**Objetivo desta branch:** acrescentar transparência para a demonstração sem alterar o fluxo de autenticação.

## Resultado honesto

O repositório contém boas decisões de arquitetura, mas **não há evidência suficiente para declarar conformidade integral com a LGPD**. O README informa que as telas acadêmicas usam dados mock, que o schema Prisma é parcial e que `withTenant/withSession` ainda não são usados pelas telas. Também não foi localizado o arquivo de políticas RLS próprio nem o conjunto de políticas demo descrito no README no caminho esperado. A implementação e o isolamento precisam ser verificados no banco real.

## O que foi encontrado

- Auth.js com sessão JWT de 8 horas e validação de vínculo/papel no banco.
- Senhas verificadas com bcrypt (custo 12); consultas de login por funções SQL `SECURITY DEFINER`, evitando conceder leitura direta da tabela de usuários à role de runtime.
- A conexão da aplicação exige `RUNTIME_DATABASE_URL` e rejeita explicitamente as roles `postgres`, `service_role` e `supabase_admin`.
- Existe um limitador de tentativas de login em memória (8 falhas/15 min), mas o próprio código avisa que não protege adequadamente múltiplas instâncias/serverless.
- O schema Prisma contém apenas organização, escola, usuários, vínculos, papéis, professor e responsável; não representa o sistema acadêmico completo.
- O README declara que painéis, alunos, responsáveis, professores, matrículas, notas e frequência ainda usam mocks.
- O helper de tenant existe, mas o README diz que ainda não é usado pelas telas.
- O seed disponibiliza contas públicas com senha `senha123`; deve permanecer restrito a desenvolvimento/demonstração e nunca ser usado em produção.

## Mudanças desta branch

1. Página pública `/privacidade` com aviso provisório, dados fictícios, transparência sobre o estado do projeto, direitos dos titulares e lacunas que a instituição precisa completar.
2. Link para o aviso na tela de login, sem alterar provider, validação, sessão, middleware, rotas ou credenciais.
3. Cabeçalhos HTTP de segurança de baixo risco, sem Content-Security-Policy que possa quebrar os scripts/fluxo de login do Next.js.
4. Este relatório para evitar que o aviso seja confundido com certificação de conformidade.

## Pendências bloqueadoras antes de dados reais

- Implementar e testar políticas RLS para **todas** as tabelas de dados escolares; testar isolamento entre duas organizações e duas escolas com a role real de runtime. Não confiar apenas em testes com postgres/superuser.
- Fazer todas as consultas e mutations de dados acadêmicos passarem por contexto tenant derivado da sessão no servidor. Não aceitar `organizationId`, `schoolId` ou papel privilegiado diretamente do cliente.
- Completar o schema, revisar relações e integridade referencial para impedir vínculo cruzado entre escolas/organizações.
- Substituir o rate limiter em memória por armazenamento compartilhado (ex.: Redis/Upstash) e configurar proteção contra abuso.
- Retirar contas/senhas de demonstração da produção, rotacionar segredos, usar TLS e revisar permissões do banco e dos serviços.
- Definir controlador, operador, encarregado/canal de contato, finalidades, bases legais por operação, registro das operações (ROPA), contratos com operadores e política de retenção/descarte.
- Criar processo de atendimento aos direitos dos titulares, incluindo responsáveis legais quando aplicável.
- Definir procedimento de incidentes, avaliação de risco e comunicação à ANPD e aos titulares nos casos e prazos aplicáveis.
- Elaborar RIPD quando aplicável ou solicitado pela ANPD; considerar o risco elevado de dados de crianças e adolescentes.
- Testar backup, restauração, criptografia em trânsito e em repouso, logs sem dados excessivos, controle de acesso e trilha de auditoria.

## Cuidados para a apresentação

- Use apenas as contas de demonstração e os dados fictícios já preparados.
- Não cadastre dados reais de estudantes, responsáveis, notas, frequência, documentos ou contatos.
- Não apresente o sistema como “100% conforme à LGPD”. Descreva-o como protótipo com controles de segurança implementados e plano de adequação em andamento.
- Não publique `.env`, senhas reais, tokens, hashes ou dados pessoais no GitHub.

## Referências legais

- Lei nº 13.709/2018 (LGPD): princípios e bases legais (arts. 6º e 7º), tratamento de dados de crianças e adolescentes (art. 14), direitos (art. 18), registro das operações (art. 37), relatório de impacto (art. 38), segurança (art. 46) e incidentes (art. 48).
- Resolução CD/ANPD nº 15/2024, que regulamenta a comunicação de incidentes de segurança.
- Lei nº 15.211/2025 (ECA Digital), quando aplicável aos serviços e funcionalidades oferecidos a crianças e adolescentes em ambiente digital.

Este documento é uma avaliação técnica preliminar, não parecer jurídico. A instituição controladora e assessoria jurídica devem validar bases legais, avisos, contratos e procedimentos.
