import { requireRole } from "@/lib/session";

/** Guard de papel: só SCHOOL_ADMIN acessa /admin. Reforçar também no servidor (Server Actions / API). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("SCHOOL_ADMIN");
  return <>{children}</>;
}
