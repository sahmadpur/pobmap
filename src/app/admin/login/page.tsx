import { Suspense } from "react";

import { LoginForm } from "@/components/admin/login-form";
import { getSeedAdminCredentials } from "@/lib/server/auth";

export default function AdminLoginPage() {
  const credentials = getSeedAdminCredentials();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
          Baku Port CMS
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Admin Login
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Sign in with the seeded administrator account. Override the defaults with
          `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars when you connect a real deployment.
        </p>

        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p>Email: {credentials.email}</p>
          <p>Password: {credentials.password}</p>
        </div>

        <div className="mt-5">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
