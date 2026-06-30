import { execSync } from "node:child_process";

// Create/sync the Postgres schema at build time, but only when the deployment
// is actually configured for Prisma. In file-store mode (local dev, previews
// without a database) this is a no-op so builds never fail on a missing DB.
if (process.env.ADMIN_STORAGE_PROVIDER === "prisma" && process.env.DATABASE_URL) {
  console.log("[build] Prisma mode — syncing schema with `prisma db push`…");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
} else {
  console.log("[build] File-store mode — skipping `prisma db push`.");
}
