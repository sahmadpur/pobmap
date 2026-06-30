import { Suspense } from "react";

import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { LoginForm } from "@/components/admin/login-form";
import { getSeedAdminCredentials } from "@/lib/server/auth";

export default function AdminLoginPage() {
  const credentials = getSeedAdminCredentials();

  return (
    <main className="admin-shell flex min-h-screen items-center justify-center px-4 py-10" lang="en">
      <div className="hc-panel relative w-full max-w-md overflow-hidden p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(246,181,61,0.16),transparent_70%)]"
        />
        <div className="relative">
          <div className="mb-4 flex justify-end">
            <AdminThemeToggle />
          </div>
          <p className="hc-eyebrow flex items-center gap-2">
            <span className="hc-live" aria-hidden="true" />
            Baku Port · Corridor Control
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--hc-text)]">
            Sign in to the console
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--hc-muted)]">
            Use the seeded administrator account. Override the defaults with{" "}
            <span className="hc-mono text-[var(--hc-text)]">ADMIN_EMAIL</span> and{" "}
            <span className="hc-mono text-[var(--hc-text)]">ADMIN_PASSWORD</span> when you connect a
            real deployment.
          </p>

          <div className="hc-inset mt-5 px-4 py-3">
            <p className="hc-label mb-2">Seed credentials</p>
            <p className="hc-mono text-sm text-[var(--hc-text)]">{credentials.email}</p>
            <p className="hc-mono text-sm text-[var(--hc-text)]">{credentials.password}</p>
          </div>

          <div className="mt-5">
            <Suspense
              fallback={<div className="text-sm text-[var(--hc-muted)]">Loading form…</div>}
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
