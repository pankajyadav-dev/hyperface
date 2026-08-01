# =====================================================================
#  Hyperface Meeting Rooms — app image (Next.js 15 + Prisma, run on Bun)
# =====================================================================
FROM oven/bun:1.1.42 AS base

# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- dependencies (cached layer) ----
# Copy manifests + prisma schema first so `bun install` (which runs
# `prisma generate` via postinstall) can see the schema.
COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install

# ---- app source + production build ----
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# Apply migrations + seed, then start. Kept in an entrypoint so the DB
# schema is always up to date before the server accepts traffic.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
