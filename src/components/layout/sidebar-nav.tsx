"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { HOME_PATHS, NAV_BY_ROLE } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/auth";

interface SidebarNavProps {
  role: Role;
  /** Fecha o drawer no mobile ao navegar. */
  onNavigate?: () => void;
}

export function SidebarNav({ role, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const groups = NAV_BY_ROLE[role];

  const isActive = (href: string) =>
    HOME_PATHS.includes(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ScrollArea className="flex-1">
      <nav className="space-y-7 px-3 py-6" aria-label="Navegação principal">
        {groups.map((group, i) => (
          <div key={group.label ?? i} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
            )}
            {group.items.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "bg-secondary text-secondary-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-[17px] shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}
