-- ============================================================================
-- Autenticação: funções de consulta usadas pelo login (schema real do projeto).
--
-- EXECUTE COM A ROLE DE MIGRAÇÃO (a dona das tabelas, ex.: postgres), nunca com a de runtime.
-- É a dona que faz a função SECURITY DEFINER enxergar as tabelas: sem FORCE ROW LEVEL SECURITY
-- (decisão B2), a dona ignora o RLS, e a role de runtime continua sujeita a ele.
--
-- Por que funções SECURITY DEFINER?
--   O login acontece ANTES de existir tenant (ainda não se sabe a escola), e a role de runtime é
--   NOSUPERUSER/NOBYPASSRLS. Em vez de abrir uma política que deixe o runtime ler `users` inteira
--   (com os hashes de senha), ele só recebe EXECUTE nestas duas funções, que devolvem o mínimo.
--
-- Regras de negócio embutidas:
--   * usuário, organização, escola e vínculo precisam estar ativos;
--   * a escola precisa ser da MESMA organização do usuário (schools.organization_id = users.organization_id);
--   * papéis aplicáveis a uma escola = atribuições com escopo SCHOOL naquela escola, ou ORGANIZATION na
--     organização do usuário. Atribuições com escopo CLASS_GROUP NÃO definem o papel da escola;
--   * o Role pode ser de sistema (organization_id nulo) ou da organização do usuário.
--
-- Se user_role_assignments tiver coluna de revogação/validade (ex.: is_active, revoked_at, expires_at),
-- acrescente o filtro no ponto marcado com "TODO" nas duas funções.
-- ============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS app_auth;
REVOKE ALL ON SCHEMA app_auth FROM PUBLIC;

-- Uma linha por escola ativa do usuário, com os nomes dos papéis que ele tem naquela escola.
CREATE OR REPLACE FUNCTION app_auth.login_lookup(p_email text)
RETURNS TABLE (
  user_id text, full_name text, email text, password_hash text,
  organization_id text, organization_name text,
  school_id text, school_name text,
  role_names text[]
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT u.id::text, u.full_name::text, u.email::text, u.password_hash::text,
         u.organization_id::text, o.name::text,
         s.id::text, s.name::text,
         COALESCE(ra.role_names, ARRAY[]::text[])
    FROM public.users u
    JOIN public.organizations o      ON o.id = u.organization_id AND o.is_active
    JOIN public.school_memberships m ON m.user_id = u.id AND m.is_active
    JOIN public.schools s            ON s.id = m.school_id AND s.is_active
                                    AND s.organization_id = u.organization_id
    LEFT JOIN LATERAL (
      SELECT array_agg(DISTINCT r.name::text ORDER BY r.name::text) AS role_names
        FROM public.user_role_assignments a
        JOIN public.roles r ON r.id = a.role_id
       WHERE a.user_id = u.id
         AND (r.organization_id IS NULL OR r.organization_id = u.organization_id)
         AND (   (a.scope_type::text = 'SCHOOL'       AND a.scope_id = s.id)
              OR (a.scope_type::text = 'ORGANIZATION' AND a.scope_id = u.organization_id))
         -- TODO: AND a.is_active   (se existir)
    ) ra ON true
   WHERE lower(u.email) = lower(p_email)
     AND u.is_active
   ORDER BY s.name, s.id;
$$;

-- Revalidação da sessão: o usuário continua ativo, na escola e com quais papéis?
CREATE OR REPLACE FUNCTION app_auth.membership_lookup(p_user_id text, p_school_id text)
RETURNS TABLE (organization_id text, school_id text, role_names text[])
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT u.organization_id::text, s.id::text,
         COALESCE(ra.role_names, ARRAY[]::text[])
    FROM public.users u
    JOIN public.organizations o      ON o.id = u.organization_id AND o.is_active
    JOIN public.school_memberships m ON m.user_id = u.id AND m.is_active
    JOIN public.schools s            ON s.id = m.school_id AND s.is_active
                                    AND s.organization_id = u.organization_id
    LEFT JOIN LATERAL (
      SELECT array_agg(DISTINCT r.name::text ORDER BY r.name::text) AS role_names
        FROM public.user_role_assignments a
        JOIN public.roles r ON r.id = a.role_id
       WHERE a.user_id = u.id
         AND (r.organization_id IS NULL OR r.organization_id = u.organization_id)
         AND (   (a.scope_type::text = 'SCHOOL'       AND a.scope_id = s.id)
              OR (a.scope_type::text = 'ORGANIZATION' AND a.scope_id = u.organization_id))
         -- TODO: AND a.is_active   (se existir)
    ) ra ON true
   WHERE u.id::text = p_user_id
     AND s.id::text = p_school_id
     AND u.is_active;
$$;

REVOKE ALL ON FUNCTION app_auth.login_lookup(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_auth.membership_lookup(text, text) FROM PUBLIC;

-- Só a role de runtime executa.
GRANT USAGE ON SCHEMA app_auth TO school_saas_runtime;
GRANT EXECUTE ON FUNCTION app_auth.login_lookup(text) TO school_saas_runtime;
GRANT EXECUTE ON FUNCTION app_auth.membership_lookup(text, text) TO school_saas_runtime;

COMMIT;
