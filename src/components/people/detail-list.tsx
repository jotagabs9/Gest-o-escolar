export interface DetailItem {
  label: string;
  value: React.ReactNode;
}

export function DetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 text-right font-medium">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
