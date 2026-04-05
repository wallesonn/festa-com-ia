#!/bin/sh
set -e

echo "⏳ Aguardando Postgres ficar disponível..."
until pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -q; do
  sleep 1
done
echo "✅ Postgres disponível."

echo "📦 Aplicando migrations..."
for f in /app/migrations/*.sql; do
  echo "   → $f"
  psql "$DATABASE_URL" -f "$f" 2>&1 | grep -v "already exists" || true
done
echo "✅ Migrations concluídas."

exec node server.js
