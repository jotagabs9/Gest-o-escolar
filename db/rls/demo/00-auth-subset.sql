-- ============================================================================
-- SUBCONJUNTO DE DEMONSTRAÇÃO do RLS (só as tabelas do esquema parcial deste projeto).
-- NÃO use junto com o seu rls-policies.sql real (ver db/rls/README.md).
--
-- Sem FORCE ROW LEVEL SECURITY: a dona das tabelas (role de migração) ignora o RLS; a role de runtime não.
-- ============================================================================
BEGIN;

-- Funções auxiliares: leem as configurações definidas por requisição (set_config(..., true)).
CREATE OR REPLACE FUNCTION current_org_id() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.current_org_id', true), '') $$;

CREATE OR REPLACE FUNCTION current_school_ids() RETURNS text[]
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(string_to_array(NULLIF(current_setting('app.current_school_ids', true), ''), ','), ARRAY[]::text[])
$$;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS text
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '') $$;

-- organizations: só a organização atual
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON organizations;
CREATE POLICY tenant_all ON organizations
  USING (id = current_org_id()) WITH CHECK (id = current_org_id());

-- schools: da organização atual e dentre as escolas da requisição
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON schools;
CREATE POLICY tenant_all ON schools
  USING (organization_id = current_org_id() AND id = ANY (current_school_ids()))
  WITH CHECK (organization_id = current_org_id() AND id = ANY (current_school_ids()));

-- users: da organização atual
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON users;
CREATE POLICY tenant_all ON users
  USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- school_memberships: das escolas da requisição
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON school_memberships;
CREATE POLICY tenant_all ON school_memberships
  USING (school_id = ANY (current_school_ids())) WITH CHECK (school_id = ANY (current_school_ids()));

-- roles: lê os de sistema (organization_id nulo) e os da organização; só escreve nos da organização
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS roles_select ON roles;
DROP POLICY IF EXISTS roles_insert ON roles;
DROP POLICY IF EXISTS roles_update ON roles;
DROP POLICY IF EXISTS roles_delete ON roles;
CREATE POLICY roles_select ON roles FOR SELECT
  USING (organization_id IS NULL OR organization_id = current_org_id());
CREATE POLICY roles_insert ON roles FOR INSERT
  WITH CHECK (organization_id = current_org_id());
CREATE POLICY roles_update ON roles FOR UPDATE
  USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
CREATE POLICY roles_delete ON roles FOR DELETE
  USING (organization_id = current_org_id());

-- user_role_assignments: só de usuários visíveis (a política de users já limita à organização)
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON user_role_assignments;
CREATE POLICY tenant_all ON user_role_assignments
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = user_role_assignments.user_id))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = user_role_assignments.user_id));

-- teachers: das escolas da requisição
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON teachers;
CREATE POLICY tenant_all ON teachers
  USING (school_id = ANY (current_school_ids())) WITH CHECK (school_id = ANY (current_school_ids()));

-- guardians: não têm school_id; só os ligados a usuários visíveis
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_all ON guardians;
CREATE POLICY tenant_all ON guardians
  USING (user_id IS NOT NULL AND EXISTS (SELECT 1 FROM users u WHERE u.id = guardians.user_id))
  WITH CHECK (user_id IS NOT NULL AND EXISTS (SELECT 1 FROM users u WHERE u.id = guardians.user_id));

COMMIT;
