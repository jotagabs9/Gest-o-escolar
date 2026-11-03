# Acessos de demonstração — aluno e professor

Este guia é exclusivo para demonstração com dados fictícios. Não usar as credenciais abaixo em produção nem para pessoas reais.

## Contas de teste

O script `scripts/seed-auth-users.ts` cria, em ambiente local de desenvolvimento:

| Perfil | Login | Senha |
| --- | --- | --- |
| Professor | `professor@escola.com` | `senha123` |
| Aluno | `aluno@escola.com` | `senha123` |
| Administrador | `admin@escola.com` | `senha123` |
| Responsável | `responsavel@escola.com` | `senha123` |

O seed é idempotente e cria os vínculos de escola e papéis. Ele recusa explicitamente `NODE_ENV=production`. Não executar contra o Supabase de produção.

## O que cada perfil demonstra

- Professor: abre `/professor`, com alocações, turmas, notas pendentes e chamadas de exemplo.
- Aluno: abre `/aluno`, com boletim, componentes curriculares, notas, frequência e avisos de exemplo.
- Administrador: mantém o fluxo administrativo atual.

**Importante:** os painéis de aluno e professor ainda usam os módulos MOCK em `src/lib/mock/aluno.ts` e `src/lib/mock/professor.ts`. A conta de aluno é uma identidade de demonstração e não está ligada a um registro real de `Student`. Não apresentar os dados como registros oficiais.

## Atalho na tela de login

O atalho de demonstração é exibido apenas quando:
- `NODE_ENV` não é `production`;
- `ENABLE_DEMO_LOGIN=true`;
- os e-mails e `DEMO_PASSWORD` estão definidos no ambiente.

Para a conta de aluno, use `DEMO_STUDENT_EMAIL=aluno@escola.com`. O campo antigo `DEMO_GUARDIAN_EMAIL` permanece como fallback de compatibilidade.

## Limitação atual

O formulário principal ainda autentica por e-mail e senha. O acesso por matrícula oficial do aluno ainda não foi implementado. O seed adiciona o papel `ALUNO`, que é mapeado para a área demonstrativa compartilhada `/aluno`.

A autenticação de professor usa o papel `PROFESSOR` existente e continua separada da área de aluno. Nenhuma mudança foi feita no login administrativo.
