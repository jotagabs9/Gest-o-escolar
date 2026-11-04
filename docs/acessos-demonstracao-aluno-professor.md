# Acessos de demonstração — AURA SYSTEM

Estas contas são exclusivamente fictícias e destinadas a ambiente local ou demonstração isolada. Não reutilize as credenciais em produção e não cadastre dados reais de estudantes.

| Perfil | E-mail | Senha | Área |
| --- | --- | --- | --- |
| Administrador | `admin@escola.com` | `senha123` | `/admin` |
| Professor | `professor@escola.com` | `senha123` | `/professor` |
| Aluno | `aluno@escola.com` | `senha123` | `/aluno` |
| Responsável | `responsavel@escola.com` | `senha123` | `/aluno` |

## Preparação

1. Configure o banco de desenvolvimento/homologação isolado.
2. Configure as variáveis `DEMO_ADMIN_EMAIL`, `DEMO_TEACHER_EMAIL`, `DEMO_STUDENT_EMAIL`, `DEMO_GUARDIAN_EMAIL` e `DEMO_PASSWORD`.
3. Execute `npm run db:seed:auth` somente nesse banco.
4. Mantenha `ENABLE_DEMO_LOGIN=true` apenas fora de produção.
5. Teste cada acesso no navegador antes da apresentação.

O seed recusa `NODE_ENV=production`, cria os papéis e vínculos escolares e pode redefinir as senhas dessas contas de demonstração ao ser executado novamente.

## Limitações

- O login de aluno e responsável ainda compartilha a área demonstrativa `/aluno`.
- Os painéis acadêmicos continuam usando dados MOCK; a conta não está ligada a um cadastro acadêmico real.
- O login por matrícula oficial ainda não existe. Alunos entram por e-mail e senha.
- O banco usado pelo site publicado não é alterado por este código. Para disponibilizar essas contas no site, é necessário executar o seed em um banco de homologação autorizado e validar o ambiente/variáveis sem expor credenciais.
