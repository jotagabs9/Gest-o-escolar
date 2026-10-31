import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { ROLE_HOME } from "@/lib/roles";
import { getSession } from "@/lib/session";
import { demoAccounts } from "@/server/auth/demo";

export const metadata: Metadata = { title: "Entrar | Gestão Escolar" };

/** Amostra ilustrativa (mock) para o painel de marca. */
const sampleRows = [
  { name: "Língua Portuguesa", grade: "8,5", freq: "96%" },
  { name: "Matemática", grade: "7,0", freq: "92%" },
  { name: "Banco de Dados", grade: "9,0", freq: "100%" },
  { name: "Projeto de Vida", grade: "8,0", freq: "94%" },
];

export default async function LoginPage() {
  // Sessão válida (já confirmada no banco): não faz sentido ver o login.
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role]);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Painel de marca: quadro-negro com um boletim de exemplo */}
      <section
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-[#1d3f38] p-12 text-[#f2efe6] lg:flex"
      >
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#f2efe6] text-[#1d3f38]">
            <GraduationCap className="size-5" />
          </span>
          Gestão Escolar
        </div>

        <div className="space-y-10">
          <h1 className="max-w-md text-4xl font-semibold leading-[1.15] tracking-tight">
            Matrícula, notas e frequência, do ano letivo ao boletim.
          </h1>

          <div className="max-w-sm -rotate-2 rounded-lg bg-[#f2efe6] p-5 text-[#1d3f38] shadow-xl">
            <div className="mb-3 flex items-baseline justify-between border-b border-[#1d3f38]/20 pb-2">
              <p className="text-sm font-semibold">Boletim · 3º ano A</p>
              <p className="text-xs text-[#1d3f38]/70">4º bimestre</p>
            </div>
            <ul className="space-y-2 text-sm">
              {sampleRows.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3">
                  <span className="truncate">{r.name}</span>
                  <span className="flex shrink-0 items-center gap-4 tabular-nums">
                    <span className="font-semibold">{r.grade}</span>
                    <span className="w-10 text-right text-[#1d3f38]/70">{r.freq}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-[#f2efe6]/60">
          Cada escola vê apenas os próprios dados.
        </p>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5 font-semibold lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-md bg-[#1d3f38] text-[#f2efe6]">
              <GraduationCap className="size-5" />
            </span>
            Gestão Escolar
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground">
              Use o e-mail cadastrado na sua escola.
            </p>
          </div>

          <LoginForm demoAccounts={demoAccounts()} />
        </div>
      </section>
    </main>
  );
}
