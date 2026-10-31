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
      <nav className="space-y-6 p-4" aria-label="Navegação principal">
        {groups.map((group, i) => (
          <div key={group.label ?? i} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
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
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#1d3f38] text-[#f2efe6]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
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
