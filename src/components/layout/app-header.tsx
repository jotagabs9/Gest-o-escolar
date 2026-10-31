import { Building2 } from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/roles";
import type { SessionUser } from "@/types/auth";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <MobileNav role={user.role} />

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Building2 className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{user.schoolName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.organizationName}</p>
        </div>
      </div>

      <Badge variant="secondary" className="hidden sm:inline-flex">
        {ROLE_LABEL[user.role]}
      </Badge>
      <UserMenu user={user} />
    </header>
  );
}
