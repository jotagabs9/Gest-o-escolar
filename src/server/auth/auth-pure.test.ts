import { describe, expect, it } from "vitest";

import { decideAccess } from "@/server/auth/access";
import { createLoginLimiter } from "@/server/auth/login-limiter";
import { mapRoleName, mapRoleNames, normalizeRoleName, resolveLoginSession } from "@/server/auth/roles";
import { TENANT_SETTING_NAMES, buildTenantSettings } from "@/server/db/tenant-settings";

describe("decideAccess", () => {
  it("libera login e rotas do Auth.js sem sessão", () => {
    expect(decideAccess("/login", null)).toEqual({ type: "allow" });
    expect(decideAccess("/api/auth/session", undefined)).toEqual({ type: "allow" });
  });

  it("exige login nas demais rotas", () => {
    expect(decideAccess("/admin", null)).toEqual({ type: "login" });
    expect(decideAccess("/", undefined)).toEqual({ type: "login" });
  });

  it("deixa cada papel na sua área e redireciona o resto para o próprio dashboard", () => {
    expect(decideAccess("/admin/alunos", "SCHOOL_ADMIN")).toEqual({ type: "allow" });
    expect(decideAccess("/admin/alunos", "TEACHER")).toEqual({ type: "redirect", to: "/professor" });
    expect(decideAccess("/professor/notas/ta_1", "STUDENT_GUARDIAN")).toEqual({ type: "redirect", to: "/aluno" });
    expect(decideAccess("/aluno", "SCHOOL_ADMIN")).toEqual({ type: "redirect", to: "/admin" });
  });

  it("não confunde prefixos parecidos", () => {
    expect(decideAccess("/administrador", "TEACHER")).toEqual({ type: "allow" });
  });
});

describe("papéis (Role.name → papel da aplicação)", () => {
  it("normaliza acento, caixa e separadores", () => {
    expect(normalizeRoleName("Admin Escola")).toBe("ADMIN_ESCOLA");
    expect(normalizeRoleName("responsável")).toBe("RESPONSAVEL");
  });

  it("mapeia os nomes esperados e ignora o resto", () => {
    expect(mapRoleName("ADMIN_ESCOLA")).toBe("SCHOOL_ADMIN");
    expect(mapRoleName("professor")).toBe("TEACHER");
    expect(mapRoleName("RESPONSAVEL")).toBe("STUDENT_GUARDIAN");
    expect(mapRoleName("ALUNO")).toBe("STUDENT_GUARDIAN");
    expect(mapRoleName("ADMIN_ORGANIZACAO")).toBeNull();
  });

  it("com vários papéis na escola, vale o de maior prioridade", () => {
    expect(mapRoleNames(["RESPONSAVEL", "PROFESSOR"])).toBe("TEACHER");
    expect(mapRoleNames(["PROFESSOR", "ADMIN_ESCOLA"])).toBe("SCHOOL_ADMIN");
    expect(mapRoleNames(["SECRETARIA"])).toBeNull();
    expect(mapRoleNames([])).toBeNull();
    expect(mapRoleNames(null)).toBeNull();
  });
});

describe("resolveLoginSession (escola padrão)", () => {
  const row = (school_id: string, school_name: string, role_names: string[] | null) => ({ school_id, school_name, role_names });

  it("ignora escolas sem papel reconhecido", () => {
    expect(resolveLoginSession([row("s1", "A", []), row("s2", "B", ["SECRETARIA"])])).toBeNull();
  });

  it("prefere a escola do papel de maior prioridade, depois o nome", () => {
    const chosen = resolveLoginSession([
      row("s1", "Escola A", ["RESPONSAVEL"]),
      row("s2", "Escola B", ["PROFESSOR"]),
      row("s3", "Escola C", ["PROFESSOR"]),
    ]);
    expect(chosen?.row.school_id).toBe("s2");
    expect(chosen?.role).toBe("TEACHER");
  });
});

describe("contexto do tenant (RLS)", () => {
  const ctx = { userId: "u1", organizationId: "o1", schoolIds: ["s1", "s2"] };

  it("monta as três configurações que o RLS lê", () => {
    expect(buildTenantSettings(ctx)).toEqual([
      { name: TENANT_SETTING_NAMES.orgId, value: "o1" },
      { name: TENANT_SETTING_NAMES.schoolIds, value: "s1,s2" },
      { name: TENANT_SETTING_NAMES.userId, value: "u1" },
    ]);
    expect(TENANT_SETTING_NAMES).toEqual({
      orgId: "app.current_org_id",
      schoolIds: "app.current_school_ids",
      userId: "app.current_user_id",
    });
  });

  it("remove escolas repetidas", () => {
    expect(buildTenantSettings({ ...ctx, schoolIds: ["s1", "s1"] })[1].value).toBe("s1");
  });

  it("rejeita ids que ampliariam o acesso (vírgula) ou estão vazios", () => {
    expect(() => buildTenantSettings({ ...ctx, schoolIds: ["s1,s2"] })).toThrow();
    expect(() => buildTenantSettings({ ...ctx, schoolIds: ["s1 "] })).toThrow();
    expect(() => buildTenantSettings({ ...ctx, schoolIds: [] })).toThrow();
    expect(() => buildTenantSettings({ ...ctx, userId: "" })).toThrow();
    expect(() => buildTenantSettings({ ...ctx, organizationId: "o1'; --" })).toThrow();
  });
});

describe("login limiter", () => {
  it("bloqueia após 8 falhas e libera depois da janela ou do reset", () => {
    let t = 0;
    const limiter = createLoginLimiter(() => t);
    for (let i = 0; i < 7; i++) limiter.registerFailure("a@x.com");
    expect(limiter.isLocked("a@x.com")).toBe(false);
    limiter.registerFailure("a@x.com");
    expect(limiter.isLocked("a@x.com")).toBe(true);
    expect(limiter.isLocked("b@x.com")).toBe(false);

    t += 16 * 60 * 1000;
    expect(limiter.isLocked("a@x.com")).toBe(false);

    for (let i = 0; i < 8; i++) limiter.registerFailure("a@x.com");
    limiter.reset("a@x.com");
    expect(limiter.isLocked("a@x.com")).toBe(false);
  });
});
