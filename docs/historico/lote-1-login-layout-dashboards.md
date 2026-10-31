> Nota histórica deste lote. Para rodar o projeto, use o `README.md` da raiz; as instruções de "copiar src/" abaixo valiam quando o projeto ainda era montado por partes.

# Gestão Escolar: telas (lote 1)

Copie a pasta `src/` para o projeto (mesclando com a existente).

## shadcn/ui necessários
npx shadcn@latest add button input label card checkbox sheet dropdown-menu avatar badge separator scroll-area progress table

## Demo
Em /login use "Acesso de demonstração" (grava o cookie `demo-role`).
Para trocar de papel: Sair e entrar com outro.

## Troca por NextAuth
Só `src/lib/session.ts` (getSession) e `src/components/auth/login-form.tsx` (signIn) mudam.
