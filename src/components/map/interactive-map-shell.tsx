"use client";

import dynamic from "next/dynamic";

import type { AdminMarker } from "@/types/admin";
import type { CorridorRoute } from "@/types/map";

const InteractiveMapApp = dynamic(
  () =>
    import("@/components/map/interactive-map-app").then(
      (module) => module.InteractiveMapApp,
    ),
  {
    ssr: false,
    loading: () => (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_-8%,_rgba(201,122,18,0.07),_transparent_38%),radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.11),_transparent_30%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_42%,_#e6edf6_100%)] text-slate-950">
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.12)_1px,transparent_1px)] [background-position:center_center] [background-size:72px_72px]" />
        <div className="grain-overlay" aria-hidden="true" />
        <section className="relative flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/90 px-6 py-6 text-center shadow-[0_28px_70px_-34px_rgba(30,58,95,0.4)] backdrop-blur">
            <p className="font-label flex items-center justify-center gap-2 text-[0.7rem] uppercase text-[var(--accent)]">
              <span className="accent-pulse" aria-hidden="true" />
              Strategic transport showcase
            </p>
            <h1 className="font-display mt-2.5 text-lg font-semibold leading-tight text-slate-950 sm:text-xl">
              Baku Port Interactive Transport Corridors
            </h1>
            <p className="mt-3 text-sm text-slate-600">Loading interactive map…</p>
          </div>
        </section>
      </main>
    ),
  },
);

export function InteractiveMapShell({
  routes,
  markers,
}: {
  routes: CorridorRoute[];
  markers?: AdminMarker[];
}) {
  return <InteractiveMapApp routes={routes} markers={markers ?? []} />;
}
