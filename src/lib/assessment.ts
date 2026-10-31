/**
 * Regras de avaliação e frequência (puras, sem dados).
 * Todos os limites (nota mínima, recuperação, frequência mínima) vêm do AssessmentRule do componente.
 */

export type EvaluationType = "NUMERIC" | "DESCRIPTIVE" | "DIAGNOSTIC";

export const EVALUATION_TYPE_LABEL: Record<EvaluationType, string> = {
  NUMERIC: "Nota numérica",
  DESCRIPTIVE: "Conceito descritivo",
  DIAGNOSTIC: "Avaliação diagnóstica",
};

export interface ConceptOption {
  value: string;
  short: string;
  label: string;
  /** Conceito considerado satisfatório (usado só em avaliação descritiva). */
  satisfactory: boolean;
}

export interface AssessmentRule {
  id: string;
  componentId: string;
  evaluationType: EvaluationType;
  maxGrade: number;
  passingGrade: number;
  recoveryMinGrade: number;
  minAttendancePct: number;
  /** Se a falta justificada conta como presença no cálculo da frequência. */
  justifiedCountsAsPresent: boolean;
  concepts: ConceptOption[];
}

export interface PeriodGrade {
  numeric?: number;
  concept?: string;
}

export type ResultStatus =
  | "NO_DATA"
  | "IN_PROGRESS"
  | "ATTENTION"
  | "APPROVED"
  | "RECOVERY"
  | "FAILED"
  | "NOT_APPLICABLE";

export const RESULT_LABEL: Record<ResultStatus, string> = {
  NO_DATA: "Sem lançamentos",
  IN_PROGRESS: "Em andamento",
  ATTENTION: "Abaixo da média",
  APPROVED: "Aprovado",
  RECOVERY: "Recuperação",
  FAILED: "Reprovado",
  NOT_APPLICABLE: "Sem nota",
};

export type Tone = "success" | "warning" | "danger" | "neutral" | "info";

export const RESULT_TONE: Record<ResultStatus, Tone> = {
  NO_DATA: "neutral",
  IN_PROGRESS: "info",
  ATTENTION: "warning",
  APPROVED: "success",
  RECOVERY: "warning",
  FAILED: "danger",
  NOT_APPLICABLE: "neutral",
};

export interface Outcome {
  average: number | null;
  status: ResultStatus;
  /** Todos os períodos já têm lançamento. */
  isFinal: boolean;
  failedByAttendance: boolean;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Calcula média e situação a partir das notas por período (na ordem dos períodos).
 * `attendancePct` só reprova quando o resultado já é final.
 */
export function computeOutcome(
  rule: AssessmentRule,
  grades: (PeriodGrade | undefined)[],
  totalPeriods: number,
  attendancePct: number | null,
): Outcome {
  const none: Outcome = { average: null, status: "NO_DATA", isFinal: false, failedByAttendance: false };

  if (rule.evaluationType === "DIAGNOSTIC") {
    return { average: null, status: "NOT_APPLICABLE", isFinal: false, failedByAttendance: false };
  }

  const lowAttendance = attendancePct !== null && attendancePct < rule.minAttendancePct;

  if (rule.evaluationType === "NUMERIC") {
    const values = grades.map((g) => g?.numeric).filter((v): v is number => typeof v === "number");
    if (values.length === 0) return none;
    const average = round1(values.reduce((s, v) => s + v, 0) / values.length);
    const isFinal = values.length >= totalPeriods;
    if (!isFinal) {
      return { average, status: average < rule.passingGrade ? "ATTENTION" : "IN_PROGRESS", isFinal, failedByAttendance: false };
    }
    const gradeStatus: ResultStatus =
      average >= rule.passingGrade ? "APPROVED" : average >= rule.recoveryMinGrade ? "RECOVERY" : "FAILED";
    // Só marca "por frequência" quando a nota, sozinha, não reprovaria o aluno.
    if (lowAttendance && gradeStatus !== "FAILED") return { average, status: "FAILED", isFinal, failedByAttendance: true };
    return { average, status: gradeStatus, isFinal, failedByAttendance: false };
  }

  // DESCRIPTIVE
  const recorded = grades.map((g) => g?.concept).filter((c): c is string => !!c);
  if (recorded.length === 0) return none;
  const last = recorded[recorded.length - 1];
  const satisfactory = rule.concepts.find((c) => c.value === last)?.satisfactory ?? false;
  const isFinal = recorded.length >= totalPeriods;
  if (!isFinal) return { average: null, status: satisfactory ? "IN_PROGRESS" : "ATTENTION", isFinal, failedByAttendance: false };
  if (lowAttendance && satisfactory) return { average: null, status: "FAILED", isFinal, failedByAttendance: true };
  return { average: null, status: satisfactory ? "APPROVED" : "RECOVERY", isFinal, failedByAttendance: false };
}

/* ---------- Frequência ---------- */

export type AttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED" | "LATE";

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Falta",
  JUSTIFIED: "Justificada",
  LATE: "Atraso",
};

export interface AttendanceTotals {
  total: number;
  present: number;
  absent: number;
  justified: number;
  late: number;
  /** Aulas que contam como presença, conforme a regra do componente. */
  attended: number;
  pct: number | null;
}

export function attendanceTotals(statuses: AttendanceStatus[], justifiedCountsAsPresent: boolean): AttendanceTotals {
  const count = (s: AttendanceStatus) => statuses.filter((x) => x === s).length;
  const present = count("PRESENT");
  const absent = count("ABSENT");
  const justified = count("JUSTIFIED");
  const late = count("LATE");
  const total = statuses.length;
  const attended = present + late + (justifiedCountsAsPresent ? justified : 0);
  return { total, present, absent, justified, late, attended, pct: total > 0 ? (attended / total) * 100 : null };
}

export function formatPct(pct: number | null): string {
  return pct === null ? "—" : `${pct.toFixed(1).replace(".", ",")}%`;
}

/* ---------- Seções do boletim (por tipo de componente) ---------- */

export type ReportSection = "GENERAL" | "ENRICHMENT" | "TECHNICAL" | "OTHER";

export const SECTION_ORDER: ReportSection[] = ["GENERAL", "ENRICHMENT", "TECHNICAL", "OTHER"];

export const SECTION_LABEL: Record<ReportSection, string> = {
  GENERAL: "Formação Geral",
  ENRICHMENT: "Itinerário, eletivas e Projeto de Vida",
  TECHNICAL: "Formação Técnica",
  OTHER: "Outros componentes",
};

export function sectionOf(componentType: string): ReportSection {
  switch (componentType) {
    case "GENERAL":
      return "GENERAL";
    case "ITINERARY":
    case "ELECTIVE":
    case "LIFE_PROJECT":
      return "ENRICHMENT";
    case "TECHNICAL":
      return "TECHNICAL";
    default:
      return "OTHER";
  }
}
