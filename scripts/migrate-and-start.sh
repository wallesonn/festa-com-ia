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

echo "📦 Aplicando migrations..."
for f in \
  /app/migrations/20260331_initial_schema.sql \
  /app/migrations/20260402_product_taxonomy_reference.sql; do
  echo "   → $f"
  psql "$DATABASE_URL" -f "$f"
done
echo "✅ Migrations concluídas."

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
