import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __bakuPrisma__: PrismaClient | undefined;
}

// Prisma 7's default client engine requires a driver adapter. We use the
// node-postgres adapter pointed at DATABASE_URL (the Neon connection string on
// Vercel), so PrismaClient can be constructed at runtime in serverless.
export function getPrismaClient() {
  if (!global.__bakuPrisma__) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    global.__bakuPrisma__ = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return global.__bakuPrisma__;
}
