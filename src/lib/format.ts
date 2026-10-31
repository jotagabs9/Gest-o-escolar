export function formatGrade(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1).replace(".", ",");
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function daysUntil(iso: string, from: Date = new Date()): number {
  const target = new Date(`${iso}T23:59:59`);
  return Math.ceil((target.getTime() - from.getTime()) / 86_400_000);
}
