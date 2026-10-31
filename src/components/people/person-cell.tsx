import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/people";

interface PersonCellProps {
  name: string;
  subtitle?: string;
  href?: string;
}

export function PersonCell({ name, subtitle, href }: PersonCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-muted text-xs font-semibold">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        {href ? (
          <Link
            href={href}
            className="block truncate font-medium underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {name}
          </Link>
        ) : (
          <p className="truncate font-medium">{name}</p>
        )}
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
