import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Option } from "@/lib/mock/academic";
import { cn } from "@/lib/utils";

/** Radix Select não aceita item com valor vazio; este valor representa "nenhum". */
const NONE_VALUE = "__none__";

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, hint, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            {" "}
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Rótulo de uma opção "nenhum" (campo opcional). */
  noneLabel?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  hint,
  error,
  required,
  disabled,
  className,
  noneLabel,
}: SelectFieldProps) {
  const current = value || (noneLabel ? NONE_VALUE : "");
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Select
        value={current}
        onValueChange={(v) => onChange(v === NONE_VALUE ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel && <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

interface FormCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormCard({ title, description, children }: FormCardProps) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

interface FormFooterProps {
  cancelHref: string;
  pending: boolean;
  submitLabel: string;
}

export function FormFooter({ cancelHref, pending, submitLabel }: FormFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
      <Button asChild type="button" variant="outline" disabled={pending}>
        <Link href={cancelHref}>Cancelar</Link>
      </Button>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
