"use client";

import { usePathname, useRouter } from "next/navigation";
import { FilterX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Option } from "@/lib/mock/academic";

export const ALL = "todos";

interface ClassGroupFiltersProps {
  yearOptions: Option[];
  stageOptions: Option[];
  year: string;
  stage: string;
  /** Valor padrão do filtro de ano (ano letivo em andamento). */
  defaultYear: string;
}

export function ClassGroupFilters({ yearOptions, stageOptions, year, stage, defaultYear }: ClassGroupFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  function update(next: { year?: string; stage?: string }) {
    const params = new URLSearchParams();
    params.set("ano", next.year ?? year);
    params.set("serie", next.stage ?? stage);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const isFiltered = year !== defaultYear || stage !== ALL;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="space-y-1.5 sm:w-48">
        <Label htmlFor="filter-year">Ano letivo</Label>
        <Select value={year} onValueChange={(v) => update({ year: v })}>
          <SelectTrigger id="filter-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os anos</SelectItem>
            {yearOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 sm:w-80">
        <Label htmlFor="filter-stage">Série / etapa</Label>
        <Select value={stage} onValueChange={(v) => update({ stage: v })}>
          <SelectTrigger id="filter-stage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as séries e etapas</SelectItem>
            {stageOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFiltered && (
        <Button type="button" variant="ghost" onClick={() => update({ year: defaultYear, stage: ALL })}>
          <FilterX className="mr-2 size-4" /> Limpar filtros
        </Button>
      )}
    </div>
  );
}
