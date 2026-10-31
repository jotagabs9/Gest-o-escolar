/**
 * Limitador de tentativas de login por e-mail, em memória do processo.
 * LIMITAÇÃO: em serverless/várias instâncias cada instância tem a sua contagem. Para produção, troque o
 * armazenamento por Redis/Upstash ou por uma tabela (mantendo esta interface).
 */
const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

interface Entry {
  failures: number;
  firstAt: number;
}

export function createLoginLimiter(now: () => number = Date.now) {
  const entries = new Map<string, Entry>();

  const live = (key: string): Entry | undefined => {
    const e = entries.get(key);
    if (e && now() - e.firstAt > WINDOW_MS) {
      entries.delete(key);
      return undefined;
    }
    return e;
  };

  return {
    isLocked(key: string): boolean {
      return (live(key)?.failures ?? 0) >= MAX_FAILURES;
    },
    registerFailure(key: string): void {
      const e = live(key);
      if (e) e.failures += 1;
      else entries.set(key, { failures: 1, firstAt: now() });
    },
    reset(key: string): void {
      entries.delete(key);
    },
  };
}

export const loginLimiter = createLoginLimiter();
