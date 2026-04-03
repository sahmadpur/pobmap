import { PrismaClient } from "@prisma/client";

declare global {
  var __bakuPrisma__: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!global.__bakuPrisma__) {
    global.__bakuPrisma__ = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return global.__bakuPrisma__;
}
