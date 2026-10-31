#!/bin/sh
# Executado UMA vez, quando o volume do banco é criado (docker-entrypoint-initdb.d).
# Cria a role de RUNTIME: a que o app usa. Ela é NOSUPERUSER e NOBYPASSRLS, então o RLS vale para ela.
# A role de MIGRAÇÃO é o próprio "postgres": dona das tabelas, usada por prisma db push, seed e scripts.
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE school_saas_runtime LOGIN PASSWORD '${RUNTIME_DB_PASSWORD}'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO school_saas_runtime;
  GRANT USAGE ON SCHEMA public TO school_saas_runtime;

  -- Tabelas e sequências criadas depois (pelo prisma db push, rodando como postgres) já nascem com estes acessos.
  ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_runtime;
  ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_USER} IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO school_saas_runtime;
EOSQL
