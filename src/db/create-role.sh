# .env
# DATABASE_URL=postgres://owner:...@host:5432/db       (existing, privileged)
# APP_DB_PASSWORD=<openssl rand -hex 24>                (new; hex stays URL-safe)
# APP_DATABASE_URL=postgres://app_user:<same password>@host:5432/db

set -a; source .env; set +a
psql "$DATABASE_URL" -v pw="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE app_user LOGIN PASSWORD :'pw' NOSUPERUSER NOBYPASSRLS;
SQL