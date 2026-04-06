#!/bin/sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL não definida."
  exit 1
fi

echo "⏳ Aguardando Postgres ficar disponível..."
until pg_isready -d "$DATABASE_URL" -q; do
  sleep 1
done
echo "✅ Postgres disponível."

SCHEMA_FILE="/app/schema/local_postgres_final.sql"
SCHEMA_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.professionals') IS NOT NULL;" | tr -d '[:space:]')
if [ "$SCHEMA_EXISTS" != "t" ]; then
  echo "📦 Aplicando schema final local..."
  echo "   → $SCHEMA_FILE"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"
  echo "✅ Schema local aplicado."
else
  echo "✅ Schema local já existe."
fi

ACTIVE_PROFESSIONALS=$(psql "$DATABASE_URL" -tAc "SELECT count(*) FROM professionals WHERE status = 'active';" | tr -d '[:space:]')
if [ "${ACTIVE_PROFESSIONALS:-0}" = "0" ]; then
  echo "👤 Criando profissional padrão..."
  psql "$DATABASE_URL" <<'SQL'
INSERT INTO professionals (
  display_name,
  business_name,
  slug,
  status,
  created_at,
  updated_at
)
VALUES (
  'Profissional Principal',
  'Festa com IA',
  'festa-com-ia',
  'active',
  now(),
  now()
);
SQL
  echo "✅ Profissional padrão criado."
fi

exec node server.js
