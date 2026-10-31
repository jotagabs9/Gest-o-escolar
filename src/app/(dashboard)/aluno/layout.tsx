import { requireRole } from "@/lib/session";

/** Guard de papel: só STUDENT_GUARDIAN acessa /aluno. Reforçar também no servidor (Server Actions / API). */
export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  await requireRole("STUDENT_GUARDIAN");
  return <>{children}</>;
}
