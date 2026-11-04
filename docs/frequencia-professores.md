# Frequência diária de professores

A funcionalidade usa a tabela `public.teacher_attendance_records`.

## Aplicar no Supabase

1. Abra o projeto Supabase e entre em **SQL Editor**.
2. No GitHub, abra `db/migrations/20261103_teacher_attendance.sql`.
3. Copie o arquivo inteiro, cole no SQL Editor e execute.
4. Confirme que a tabela foi criada e que não houve erro de permissões.

A migration não usa `prisma db push` e não altera tabelas acadêmicas já existentes.

## Acesso

- Secretaria/admin: registra presença, falta ou atraso, horário e observação em `/admin/frequencia-professores`.
- Professor: consulta o próprio histórico em `/professor/minha-frequencia`.
- A frequência de alunos continua no módulo próprio.

A aplicação precisa estar conectada com a role de runtime que tenha SELECT/INSERT/UPDATE na nova tabela. A migration concede essas permissões às roles `app_runtime` e `authenticated` se existirem. Se o projeto usa outro nome para a role de runtime, conceda SELECT, INSERT e UPDATE nessa tabela a essa role, mantendo RLS habilitado.
