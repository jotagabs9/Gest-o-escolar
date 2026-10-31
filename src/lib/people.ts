/** Helpers puros de Pessoas/Matrículas (sem dados). */

export function ageFromBirthDate(iso: string, now: Date = new Date()): number {
  const [y, m, d] = iso.split("-").map(Number);
  let age = now.getFullYear() - y;
  const hadBirthday = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return age;
}

export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Busca simples, sem acento e sem diferenciar maiúsculas. */
export function matchesQuery(query: string | undefined, ...fields: (string | undefined | null)[]): boolean {
  if (!query || !query.trim()) return true;
  const q = normalizeText(query);
  return fields.some((f) => f && normalizeText(f).includes(q));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]!.toUpperCase())
    .join("");
}
