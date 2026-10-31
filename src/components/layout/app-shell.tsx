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
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-border/80 bg-[#fbfcf9] lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-border/70 px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#173f35] text-[#f3f4ef] shadow-sm">
            <GraduationCap className="size-[18px]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-[-0.025em] text-[#20352d]">Gestão Escolar</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.13em] text-[#78847c]">Plataforma de gestão</p>
          </div>
        </div>
        <SidebarNav role={user.role} />
        <div className="border-t border-border/70 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">Ambiente escolar</p>
          <p className="mt-1 truncate text-xs font-medium text-foreground">{user.schoolName}</p>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <AppHeader user={user} />
        <main className="mx-auto w-full max-w-[1440px] space-y-7 px-4 py-6 sm:px-7 sm:py-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
