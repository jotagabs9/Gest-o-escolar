/** Regras de avaliação vêm do sistema (por escola/matriz), nunca fixas no componente. */
export interface GradingRules {
  passingGrade: number;
  minAttendancePct: number;
}

export type ComponentStatus = "OK" | "ATTENTION" | "RISK";

export function average(grades: (number | null)[]): number | null {
  const valid = grades.filter((g): g is number => g !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, g) => sum + g, 0) / valid.length;
}

export function componentStatus(
  avg: number | null,
  attendancePct: number,
  rules: GradingRules,
): ComponentStatus {
  if (attendancePct < rules.minAttendancePct) return "RISK";
  if (avg !== null && avg < rules.passingGrade) return "ATTENTION";
  return "OK";
}

export const STATUS_LABEL: Record<ComponentStatus, string> = {
  OK: "Em dia",
  ATTENTION: "Atenção",
  RISK: "Em risco",
};

export const STATUS_CLASS: Record<ComponentStatus, string> = {
  OK: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  ATTENTION:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  RISK: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};
