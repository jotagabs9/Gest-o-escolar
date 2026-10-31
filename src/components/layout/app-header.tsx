import { Building2 } from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/roles";
import type { SessionUser } from "@/types/auth";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border/80 bg-[#fbfcf9]/95 px-4 backdrop-blur-sm sm:px-7 xl:px-10">
      <MobileNav role={user.role} />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden size-8 items-center justify-center rounded-lg bg-[#edf1ec] text-[#52685b] sm:flex">
          <Building2 className="size-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#263b31]">{user.schoolName}</p>
          <p className="mt-1 truncate text-[11px] text-[#7a877f]">{user.organizationName}</p>
        </div>
      </div>

      <Badge variant="outline" className="hidden border-[#dce4dc] bg-white/70 px-2.5 py-1 text-[10px] font-medium text-[#52665a] sm:inline-flex">
        {ROLE_LABEL[user.role]}
      </Badge>
      <UserMenu user={user} />
    </header>
  );
}
