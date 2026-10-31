"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Option } from "@/lib/mock/academic";

export const ALL = "todos";

export interface FilterField {
  key: string;
  label: string;
  allLabel: string;
  options: Option[];
  className?: string;
}

interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string>;
  defaults: Record<string, string>;
  search?: { key: string; label: string; placeholder: string };
}

/** Filtros e busca guardados na URL (a página servidor lê os searchParams). */
export function FilterBar({ fields, values, defaults, search }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(search ? (values[search.key] ?? "") : "");

  function push(next: Record<string, string>) {
    const params = new URLSearchParams();
    for (const f of fields) params.set(f.key, next[f.key] ?? values[f.key] ?? defaults[f.key] ?? ALL);
    if (search) {
      const term = (next[search.key] ?? q).trim();
      if (term) params.set(search.key, term);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (!search) return;
    if (q.trim() === (values[search.key] ?? "")) return;
    const t = setTimeout(() => push({ [search.key]: q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const isFiltered = fields.some((f) => (values[f.key] ?? defaults[f.key]) !== defaults[f.key]) || q.trim() !== "";

  function reset() {
    setQ("");
    const params = new URLSearchParams();
    for (const f of fields) params.set(f.key, defaults[f.key]);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      {search && (
        <div className="space-y-1.5 lg:w-72">
          <Label htmlFor={`filter-${search.key}`}>{search.label}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`filter-${search.key}`}
              type="search"
              className="pl-9"
              placeholder={search.placeholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      )}

      {fields.map((f) => (
        <div key={f.key} className={f.className ?? "space-y-1.5 lg:w-52"}>
          <Label htmlFor={`filter-${f.key}`}>{f.label}</Label>
          <Select value={values[f.key] ?? defaults[f.key]} onValueChange={(v) => push({ [f.key]: v })}>
            <SelectTrigger id={`filter-${f.key}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{f.allLabel}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {isFiltered && (
        <Button type="button" variant="ghost" onClick={reset}>
          <FilterX className="mr-2 size-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
