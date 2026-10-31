import type { Role } from "@/types/auth";

export const ROLE_LABEL: Record<Role, string> = {
  SCHOOL_ADMIN: "Admin da Escola",
  TEACHER: "Professor",
  STUDENT_GUARDIAN: "Aluno / Responsável",
};

export const ROLE_HOME: Record<Role, string> = {
  SCHOOL_ADMIN: "/admin",
  TEACHER: "/professor",
  STUDENT_GUARDIAN: "/aluno",
};

export const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
