# Diagnóstico de login no Supabase

O login administrativo já funcionar indica que o site consegue consultar o banco e validar pelo menos uma conta. Quando professor/aluno recebem "e-mail ou senha incorretos", as causas mais prováveis são: conta ausente, usuário inativo, vínculo escolar ausente/inativo, papel sem atribuição no escopo correto ou senha diferente da esperada.

## Diagnóstico seguro

1. Abra o projeto no Supabase.
2. Entre em **SQL Editor** e crie uma consulta.
3. Copie e execute o conteúdo de `db/auth/002-diagnostico-logins.sql`.
4. Envie o resultado da tabela aqui.

A consulta é somente leitura. Ela não altera usuários, senhas ou permissões e não revela hashes de senha. Ela verifica as quatro contas demonstrativas, status de usuário/organização/escola/vínculo, existência de hash e papéis atribuídos.

## Depois do diagnóstico

- Se professor ou aluno não existirem, será necessário criar a conta no banco correto.
- Se a conta existir mas não tiver papel ou vínculo ativo, corrigiremos somente esses registros.
- Se tudo estiver ativo e o papel correto estiver presente, investigaremos o hash de senha.
- Não rode o seed geral na base publicada: ele redefine senhas fixas das contas de teste e seleciona a primeira organização/escola ativa.
- Não compartilhe `DATABASE_URL`, `DIRECT_URL`, `RUNTIME_DATABASE_URL`, `AUTH_SECRET`, service role key ou qualquer senha.

## Observação Supabase

A aplicação usa PostgreSQL do Supabase via Prisma, com uma role de runtime separada e políticas RLS. Não substitua a conexão de runtime pela chave `service_role` nem por usuário `postgres`: isso pode contornar o isolamento entre escolas.
