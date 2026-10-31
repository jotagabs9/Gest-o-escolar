import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { lookupLogin } from "@/server/auth/directory";
import { loginLimiter } from "@/server/auth/login-limiter";
import { verifyPassword } from "@/server/auth/password";
import { resolveLoginSession } from "@/server/auth/roles";
import { loginSchema } from "@/server/auth/schemas";
import type { SessionUser } from "@/types/auth";

export class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (loginLimiter.isLocked(email)) throw new TooManyAttempts();

        // 1) usuário pelo e-mail (+ escolas ativas e papéis em cada uma), 2) senha, 3) escola padrão e papel principal.
        const rows = await lookupLogin(email);

        const valid = await verifyPassword(password, rows[0]?.password_hash);
        if (!rows[0] || !valid) {
          loginLimiter.registerFailure(email);
          return null;
        }

        // Escola padrão: entre as escolas com papel reconhecido, a do papel de maior prioridade (depois, pelo nome).
        // Sem nenhuma escola com papel que tenha tela, o login é negado.
        // TODO: se o usuário tiver mais de uma escola, oferecer a escolha no login.
        const chosen = resolveLoginSession(rows);
        if (!chosen) return null;

        loginLimiter.reset(email);
        const authorized: SessionUser = {
          id: chosen.row.user_id,
          name: chosen.row.full_name,
          email: chosen.row.email,
          role: chosen.role,
          schoolId: chosen.row.school_id,
          schoolName: chosen.row.school_name,
          organizationId: chosen.row.organization_id,
          organizationName: chosen.row.organization_name,
        };
        return authorized;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      // `user` só existe no momento do login: copia o que a sessão precisa.
      if (user) {
        // `user` é exatamente o objeto devolvido por authorize() (SessionUser).
        const u = user as unknown as SessionUser;
        token.uid = u.id;
        token.role = u.role;
        token.schoolId = u.schoolId;
        token.schoolName = u.schoolName;
        token.organizationId = u.organizationId;
        token.organizationName = u.organizationName;
      }
      return token;
    },
  },
});
