import Link from "next/link";

import { cn } from "@/lib/utils";

interface SegmentedLinksProps {
  label: string;
  items: { href: string; label: string; active: boolean }[];
}

/** Seletor por links (a página servidor lê a seleção da URL). */
export function SegmentedLinks({ label, items }: SegmentedLinksProps) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
            i.active
              ? "border-[#1d3f38] bg-[#1d3f38] text-[#f2efe6]"
              : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
