"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { demoEmail, demoEnabled } from "@/server/auth/demo";
import { loginSchema } from "@/server/auth/schemas";
import type { Role } from "@/types/auth";

export type LoginState = { error?: string };

export async function authenticate(input: { email: string; password: string }): Promise<LoginState> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Informe um e-mail e uma senha válidos." };

  try {
    // Em caso de sucesso o Auth.js redireciona (lança NEXT_REDIRECT, que precisa ser repassado).
    await signIn("credentials", { ...parsed.data, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      if ("code" in error && error.code === "too_many_attempts") {
        return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
      }
      if (error.type === "CredentialsSignin") return { error: "E-mail ou senha incorretos." };
      return { error: "Não foi possível entrar agora. Tente novamente." };
    }
    throw error;
  }
  return {};
}

/** Só em desenvolvimento (ENABLE_DEMO_LOGIN=true). A senha vem do servidor e nunca vai para o navegador. */
export async function demoLogin(role: Role): Promise<LoginState> {
  if (!demoEnabled()) return { error: "O acesso de demonstração está desativado." };
  const email = demoEmail(role);
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return { error: "Defina os DEMO_* no .env para usar o acesso de demonstração." };
  return authenticate({ email, password });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
