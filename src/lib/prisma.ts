import { PrismaClient } from "@prisma/client";

// Cache the client on globalThis so Next.js hot-reload in dev doesn't
// open a new pool of connections on every change.
declare global {
  // eslint-disable-next-line no-var
  var __hyperfacePrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__hyperfacePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__hyperfacePrisma = prisma;
}
