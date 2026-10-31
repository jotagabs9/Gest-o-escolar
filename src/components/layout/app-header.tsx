import { Building2 } from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/roles";
import type { SessionUser } from "@/types/auth";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-2 border-b border-border/80 bg-background/95 px-4 backdrop-blur-sm sm:gap-3 sm:px-7 xl:px-10">
      <MobileNav role={user.role} />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground sm:flex">
          <Building2 className="size-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em]">{user.schoolName}</p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{user.organizationName}</p>
        </div>
      </div>
      <Badge variant="outline" className="hidden border-border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground sm:inline-flex">
        {ROLE_LABEL[user.role]}
      </Badge>
      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}
