import type { DefaultSession } from "next-auth";
import type { Role } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      schoolId: string;
      schoolName: string;
      organizationId: string;
      organizationName: string;
    } & DefaultSession["user"];
  }
}

/*
 * Sem augmentação de `User` nem de `next-auth/jwt` de propósito. No Auth.js v5 esses tipos são declarados em
 * `@auth/core` e apenas reexportados; `declare module "next-auth/jwt"` cria um `JWT` local que NÃO é o usado nos
 * callbacks, então `token.uid` continuava `unknown`. Os campos do token são validados em `auth.config.ts` (typeof/isRole)
 * e o usuário do login é tipado como `SessionUser` em `auth.ts`.
 */
