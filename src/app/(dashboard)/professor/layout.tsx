import { requireRole } from "@/lib/session";

/** Guard de papel: só TEACHER acessa /professor. Reforçar também no servidor (Server Actions / API). */
export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  await requireRole("TEACHER");
  return <>{children}</>;
}
