import { execSync } from "node:child_process";

// Create/sync the Postgres schema during install, but only when the deployment
// is actually configured for Prisma. In file-store mode (local dev, previews
// without a database) this is a no-op so installs never fail on a missing DB.
//
// This lives in `postinstall` rather than the build command because the Vercel
// project overrides the build command, which would skip a build-time step.
const provider = process.env.ADMIN_STORAGE_PROVIDER ?? "(unset)";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

console.log(
  `[db-push] ADMIN_STORAGE_PROVIDER=${provider} DATABASE_URL=${hasDatabaseUrl ? "set" : "(unset)"}`,
);

if (provider === "prisma" && hasDatabaseUrl) {
  console.log("[db-push] Prisma mode — syncing schema with `prisma db push`…");
  execSync("npx prisma db push", { stdio: "inherit" });
} else {
  console.log("[db-push] File-store mode — skipping `prisma db push`.");
}
