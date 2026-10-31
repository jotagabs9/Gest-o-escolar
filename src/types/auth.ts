export type Role = "SCHOOL_ADMIN" | "TEACHER" | "STUDENT_GUARDIAN";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Tenant: escola atual. Alimenta o contexto de RLS (ex.: app.current_school_id). */
  schoolId: string;
  schoolName: string;
  /** Tenant: organização (rede/mantenedora) à qual a escola pertence. */
  organizationId: string;
  organizationName: string;
}
