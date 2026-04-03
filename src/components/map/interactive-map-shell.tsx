"use client";

import dynamic from "next/dynamic";

import type { CorridorRoute } from "@/types/map";

const InteractiveMapApp = dynamic(
  () =>
    import("@/components/map/interactive-map-app").then(
      (module) => module.InteractiveMapApp,
    ),
  {
    ssr: false,
    loading: () => (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_42%,_#e6edf6_100%)] text-slate-950">
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.12)_1px,transparent_1px)] [background-position:center_center] [background-size:72px_72px]" />
        <section className="relative flex min-h-screen items-center justify-center p-6">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 px-6 py-5 text-center shadow-xl shadow-slate-300/35 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-sky-500">
              Strategic transport showcase
            </p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
              Baku Port Interactive Transport Corridors
            </h1>
            <p className="mt-3 text-sm text-slate-600">Loading interactive map...</p>
          </div>
        </section>
      </main>
    ),
  },
);

export function InteractiveMapShell({ routes }: { routes: CorridorRoute[] }) {
  return <InteractiveMapApp routes={routes} />;
}
