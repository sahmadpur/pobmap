import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` only needs a syntactically valid datasource URL.
    // Use a local fallback so builds succeed when the app is running in file-store mode.
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/baku_port",
  },
});
