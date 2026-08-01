#!/bin/sh
set -e

echo "Waiting for Postgres and applying migrations..."
attempts=0
until npx prisma migrate deploy; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 15 ]; then
    echo "Could not reach the database after several attempts."
    exit 1
  fi
  echo "Database not ready yet, retrying in 2s ($attempts/15)"
  sleep 2
done

echo "Seeding sample data (no-op if data already exists)..."
npm run db:seed || echo "seed skipped"

echo "Starting API on port ${PORT:-4000}..."
exec npm run start
