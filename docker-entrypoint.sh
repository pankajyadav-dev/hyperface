#!/bin/sh
set -e

echo "→ Waiting for Postgres & applying migrations..."
# `migrate deploy` is retried because the DB may still be starting up.
attempts=0
until bunx prisma migrate deploy; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 15 ]; then
    echo "✗ Could not reach the database after several attempts."
    exit 1
  fi
  echo "  ...database not ready yet, retrying in 2s ($attempts/15)"
  sleep 2
done

echo "→ Seeding sample data (no-op if data already exists)..."
bun prisma/seed.ts || echo "  (seed skipped)"

echo "→ Starting Next.js on port ${PORT:-3000}..."
exec bun run start
