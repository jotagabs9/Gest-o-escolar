"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABEL } from "@/lib/roles";
import { authenticate, demoLogin } from "@/server/auth/actions";
import type { Role } from "@/types/auth";

interface LoginFormProps {
  /** Só vem preenchido em desenvolvimento com ENABLE_DEMO_LOGIN=true. */
  demoAccounts?: { role: Role; email: string }[];
}

export function LoginForm({ demoAccounts = [] }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }

    startTransition(async () => {
      // Sucesso: o servidor redireciona. Só voltamos aqui se houver erro.
      const result = await authenticate({ email, password });
      if (result?.error) setError(result.error);
    });
  }

  function handleDemo(role: Role) {
    setError(null);
    startTransition(async () => {
      const result = await demoLogin(role);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="voce@escola.edu.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Entrar
        </Button>
      </form>

      {demoAccounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">Acesso de demonstração (desenvolvimento)</span>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-2">
            {demoAccounts.map(({ role, email }) => (
              <Button
                key={role}
                type="button"
                variant="outline"
                className="h-auto justify-between py-2"
                onClick={() => handleDemo(role)}
                disabled={isPending}
              >
                <span className="font-medium">{ROLE_LABEL[role]}</span>
                <span className="text-xs font-normal text-muted-foreground">{email}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
