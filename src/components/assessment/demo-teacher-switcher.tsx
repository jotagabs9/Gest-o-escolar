"use client";

import { useRouter } from "next/navigation";

interface DemoTeacherSwitcherProps {
  current: string;
  options: { value: string; label: string }[];
}

/** Somente demonstração (fora de produção): troca o professor do mock sem mexer no login. */
export function DemoTeacherSwitcher({ current, options }: DemoTeacherSwitcherProps) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    document.cookie = `demo-teacher=${e.target.value}; path=/; max-age=86400; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
      <label htmlFor="demo-teacher">Demonstração: ver como</label>
      <select
        id="demo-teacher"
        value={current}
        onChange={onChange}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
