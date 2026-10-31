import type { NextAuthConfig } from "next-auth";

import { isRole } from "@/lib/roles";
import { decideAccess } from "@/server/auth/access";

/**
 * Parte da configuração que roda no middleware (edge): sem Prisma, sem bcrypt.
 * O provider de credenciais e o acesso ao banco ficam em `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 horas
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const decision = decideAccess(nextUrl.pathname, auth?.user?.role);
      if (decision.type === "allow") return true;
      if (decision.type === "login") return false; // o Auth.js redireciona para /login
      return Response.redirect(new URL(decision.to, nextUrl));
    },
    session({ session, token }) {
      // Os campos do token são `unknown` para o TypeScript (o JWT do Auth.js v5 é um Record<string, unknown>).
      // Validar com typeof/isRole estreita o tipo de verdade e ainda descarta um token malformado.
      const { uid, role, schoolId, schoolName, organizationId, organizationName } = token;
      if (typeof uid === "string" && typeof schoolId === "string" && isRole(role)) {
        session.user.id = uid;
        session.user.role = role;
        session.user.schoolId = schoolId;
        session.user.schoolName = typeof schoolName === "string" ? schoolName : "";
        session.user.organizationId = typeof organizationId === "string" ? organizationId : "";
        session.user.organizationName = typeof organizationName === "string" ? organizationName : "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
