"use client";

import { Plus, Trash2 } from "lucide-react";

import { SelectField } from "@/components/academic/form-parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Option } from "@/lib/mock/academic";
import { RELATIONSHIP_OPTIONS } from "@/lib/mock/people";

export interface LinkRow {
  key: string;
  targetId: string;
  relationship: string;
  isPrimary: boolean;
}

export const newRowKey = () => Math.random().toString(36).slice(2, 9);

/** Valida campos obrigatórios e duplicidade. Chaves de erro: `${row.key}:target` e `${row.key}:rel`. */
export function validateLinkRows(rows: LinkRow[], noun: string) {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  for (const r of rows) {
    if (!r.targetId) errors[`${r.key}:target`] = `Escolha o ${noun}.`;
    else if (seen.has(r.targetId)) errors[`${r.key}:target`] = `Este ${noun} já foi adicionado.`;
    else seen.add(r.targetId);
    if (!r.relationship) errors[`${r.key}:rel`] = "Informe o parentesco.";
  }
  return errors;
}

interface GuardianLinksProps {
  id: string;
  /** "Responsável" ou "Aluno": o que cada linha escolhe. */
  targetLabel: string;
  targetOptions: Option[];
  rows: LinkRow[];
  onChange: (rows: LinkRow[]) => void;
  rowErrors?: Record<string, string>;
  groupError?: string;
  addLabel: string;
  emptyHint: string;
  disabled?: boolean;
}

export function GuardianLinks({
  id,
  targetLabel,
  targetOptions,
  rows,
  onChange,
  rowErrors = {},
  groupError,
  addLabel,
  emptyHint,
  disabled,
}: GuardianLinksProps) {
  function update(key: string, patch: Partial<LinkRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function setPrimary(key: string, checked: boolean) {
    if (checked) onChange(rows.map((r) => ({ ...r, isPrimary: r.key === key })));
    else update(key, { isPrimary: false });
  }

  function remove(key: string) {
    const next = rows.filter((r) => r.key !== key);
    if (next.length > 0 && !next.some((r) => r.isPrimary)) next[0] = { ...next[0], isPrimary: true };
    onChange(next);
  }

  function add() {
    onChange([...rows, { key: newRowKey(), targetId: "", relationship: "", isPrimary: rows.length === 0 }]);
  }

  return (
    <div className="space-y-3" role="group" aria-labelledby={`${id}-title`}>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{emptyHint}</p>}

      {rows.map((r, i) => (
        <div key={r.key} className="space-y-3 rounded-md border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id={`${id}-${r.key}-target`}
              label={`${targetLabel} ${rows.length > 1 ? i + 1 : ""}`.trim()}
              value={r.targetId}
              onChange={(v) => update(r.key, { targetId: v })}
              options={targetOptions}
              error={rowErrors[`${r.key}:target`]}
              disabled={disabled}
            />
            <SelectField
              id={`${id}-${r.key}-rel`}
              label="Parentesco"
              value={r.relationship}
              onChange={(v) => update(r.key, { relationship: v })}
              options={RELATIONSHIP_OPTIONS}
              error={rowErrors[`${r.key}:rel`]}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${id}-${r.key}-primary`}
                checked={r.isPrimary}
                onCheckedChange={(c) => setPrimary(r.key, c === true)}
                disabled={disabled}
              />
              <Label htmlFor={`${id}-${r.key}-primary`} className="text-sm font-normal">
                Responsável principal
              </Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(r.key)}
              disabled={disabled}
              aria-label={`Remover ${targetLabel.toLowerCase()} ${i + 1}`}
            >
              <Trash2 className="mr-2 size-4" /> Remover
            </Button>
          </div>
        </div>
      ))}

      {groupError && (
        <p role="alert" className="text-sm text-destructive">
          {groupError}
        </p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={add} disabled={disabled}>
        <Plus className="mr-2 size-4" /> {addLabel}
      </Button>
    </div>
  );
}
