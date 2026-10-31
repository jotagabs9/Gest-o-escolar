import { GraduationCap } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { SessionUser } from "@/types/auth";

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b px-5 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-md bg-[#1d3f38] text-[#f2efe6]">
            <GraduationCap className="size-4" />
          </span>
          Gestão Escolar
        </div>
        <SidebarNav role={user.role} />
      </aside>

      <div className="lg:pl-64">
        <AppHeader user={user} />
        <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
