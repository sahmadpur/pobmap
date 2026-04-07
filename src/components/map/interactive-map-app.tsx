"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import {
  Globe2,
  Maximize2,
  Minimize2,
  MoonStar,
  RotateCcw,
  Route,
  ShipWheel,
  SlidersHorizontal,
  SunMedium,
  TrainFront,
  Truck,
  Waves,
} from "lucide-react";

import "@/lib/i18n";
import {
  getLocalizedText,
  SUPPORTED_LOCALES,
  TRANSPORT_MODE_META,
} from "@/data/corridors";
import { RouteDetailsPanel } from "@/components/map/route-details-panel";
import type { AdminMarker } from "@/types/admin";
import type {
  CorridorRoute,
  CorridorStatus,
  SupportedLocale,
  TransportMode,
} from "@/types/map";

const CorridorMapCanvas = dynamic(() => import("@/components/map/corridor-map-canvas"), {
  ssr: false,
});

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  az: "Azerbaijani",
  en: "English",
  ru: "Russian",
};

const DEFAULT_MODES: TransportMode[] = ["rail", "ship", "road"];
const DEFAULT_STATUSES: CorridorStatus[] = ["active", "planned", "suspended"];

type ThemeMode = "dark" | "light";

function toggleValue<T>(items: T[], value: T): T[] {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }

  return [...items, value];
}

function ModeGlyph({ mode }: { mode: TransportMode }) {
  if (mode === "rail") {
    return <TrainFront className="h-4 w-4" aria-hidden="true" />;
  }

  if (mode === "ship") {
    return <ShipWheel className="h-4 w-4" aria-hidden="true" />;
  }

  return <Truck className="h-4 w-4" aria-hidden="true" />;
}

export function InteractiveMapApp({
  routes,
  markers,
}: {
  routes: CorridorRoute[];
  markers?: AdminMarker[];
}) {
  const safeMarkers = markers ?? [];
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [locale, setLocale] = useState<SupportedLocale>("az");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [enabledRouteIds, setEnabledRouteIds] = useState<string[]>(
    routes.map((route) => route.id),
  );
  const [enabledModes, setEnabledModes] = useState<TransportMode[]>(DEFAULT_MODES);
  const [enabledStatuses, setEnabledStatuses] = useState<CorridorStatus[]>(DEFAULT_STATUSES);
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [resetCount, setResetCount] = useState(0);
  const [isMapOnlyMode, setIsMapOnlyMode] = useState(false);
  const availableRouteIds = routes.map((route) => route.id);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedLocale = window.localStorage.getItem("baku-port-language");
      const storedTheme = window.localStorage.getItem("baku-port-theme");
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (storedLocale === "az" || storedLocale === "en" || storedLocale === "ru") {
        setLocale(storedLocale);
      }

      if (storedTheme === "dark" || storedTheme === "light") {
        setTheme(storedTheme);
      }

      if (coarsePointer || reducedMotion) {
        setShowFlowAnimation(false);
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    i18n.changeLanguage(locale);
    window.localStorage.setItem("baku-port-language", locale);
  }, [i18n, locale]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("baku-port-theme", theme);
  }, [theme]);

  const effectiveEnabledRouteIds = (() => {
    const nextRouteIds = enabledRouteIds.filter((routeId) =>
      availableRouteIds.includes(routeId),
    );

    if (enabledRouteIds.length === 0) {
      return [];
    }

    return nextRouteIds;
  })();

  const visibleRoutes: CorridorRoute[] = routes.filter((route) => {
    if (
      !effectiveEnabledRouteIds.includes(route.id) ||
      !enabledStatuses.includes(route.status)
    ) {
      return false;
    }

    return route.segments.some((segment) => enabledModes.includes(segment.mode));
  }).map((route) => ({
    ...route,
    segments: route.segments.filter((segment) => enabledModes.includes(segment.mode)),
  }));

  const activeSelectedRouteId = visibleRoutes.some(
    (route) => route.id === selectedRouteId,
  )
    ? selectedRouteId
    : null;

  const selectedRoute =
    visibleRoutes.find((route) => route.id === activeSelectedRouteId) ?? null;
  const activeSelectedSegmentId =
    selectedRoute?.segments.some((segment) => segment.id === selectedSegmentId)
      ? selectedSegmentId
      : null;

  function handleRouteSelect(routeId: string, segmentId: string | null = null) {
    if (selectedRouteId !== routeId) {
      setSelectedRouteId(routeId);
      setSelectedSegmentId(null);
      return;
    }

    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);
  }

  function handlePortCorridorSelect(routeId: string) {
    const route = routes.find((item) => item.id === routeId);

    if (!route) {
      handleRouteSelect(routeId);
      return;
    }

    setEnabledRouteIds((current) =>
      current.includes(routeId) ? current : [...current, routeId],
    );
    setEnabledStatuses((current) =>
      current.includes(route.status) ? current : [...current, route.status],
    );
    setEnabledModes((current) => {
      const nextModes = new Set(current);

      route.segments.forEach((segment) => {
        nextModes.add(segment.mode);
      });

      return Array.from(nextModes);
    });

    handleRouteSelect(routeId);
  }

  const isDark = theme === "dark";
  const pageClass = isDark
    ? "bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.18),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#040b19_38%,_#091325_100%)] text-slate-50"
    : "bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_42%,_#e6edf6_100%)] text-slate-950";
  const gridClass = isDark
    ? "opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]"
    : "opacity-45 [background-image:linear-gradient(rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.12)_1px,transparent_1px)]";
  const cardClass = isDark
    ? "border-white/12 bg-slate-950/72 shadow-2xl shadow-slate-950/20"
    : "border-slate-200/80 bg-white/90 shadow-xl shadow-slate-300/35";
  const buttonClass = isDark
    ? "border-white/12 bg-white/6 text-slate-100 hover:bg-white/12"
    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100";
  const mutedTextClass = isDark ? "text-slate-300" : "text-slate-600";
  const headingTextClass = isDark ? "text-white" : "text-slate-950";
  const subtleTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const sectionCardClass = isDark
    ? "rounded-2xl border border-white/10 bg-white/5 p-3"
    : "rounded-2xl border border-slate-200 bg-slate-50/85 p-3";
  const chipBaseClass = isDark
    ? "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const enabledCorridorChipClass = isDark
    ? "border-sky-300/30 bg-sky-400/14 text-sky-50"
    : "border-sky-200 bg-sky-50 text-sky-800";
  const selectClass = isDark
    ? "bg-slate-950 text-slate-100"
    : "bg-white text-slate-800";

  return (
    <main className={`relative min-h-screen overflow-hidden ${pageClass}`}>
      <div
        className={`absolute inset-0 [background-position:center_center] [background-size:72px_72px] ${gridClass}`}
      />

      <section className="relative flex min-h-screen flex-col">
        {!isMapOnlyMode ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[450] p-4 xl:p-6">
            <div
              className={`pointer-events-auto mb-4 flex flex-col gap-4 rounded-[1.75rem] border px-5 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between ${cardClass}`}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-sky-500">
                  {t("app.eyebrow")}
                </p>
                <h1 className={`mt-2 text-xl font-semibold sm:text-2xl ${headingTextClass}`}>
                  {t("app.title")}
                </h1>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm ${buttonClass}`}
                >
                  <Globe2 className="h-4 w-4 text-sky-500" aria-hidden="true" />
                  <select
                    aria-label="Language"
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as SupportedLocale)}
                    className={`min-w-36 appearance-none rounded-full border-0 px-1 py-0 outline-none ${selectClass}`}
                  >
                    {SUPPORTED_LOCALES.map((language) => (
                      <option key={language} value={language}>
                        {LOCALE_LABELS[language]}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                  className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                >
                  {isDark ? (
                    <SunMedium className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <MoonStar className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isDark ? t("controls.switchToLight") : t("controls.switchToDark")}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMapOnlyMode(true)}
                  className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                >
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  {t("controls.mapOnly")}
                </button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,26rem)_1fr] xl:items-start">
            <div className="flex flex-col gap-4">
              <div
                className={`pointer-events-auto rounded-[2rem] border p-4 backdrop-blur ${cardClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex items-center gap-2 text-xs uppercase tracking-[0.28em] ${subtleTextClass}`}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {t("filters.title")}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEnabledRouteIds(availableRouteIds);
                      setEnabledModes(DEFAULT_MODES);
                      setEnabledStatuses(DEFAULT_STATUSES);
                    }}
                    className="text-xs font-medium text-sky-500 transition hover:text-sky-600"
                  >
                    {t("filters.enableAll")}
                  </button>
                </div>

                <div className="mt-4 grid gap-4">
                  <section>
                    <div
                      className={`mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] ${subtleTextClass}`}
                    >
                      <span>{t("filters.corridors")}</span>
                      <button
                        type="button"
                        onClick={() => setEnabledRouteIds([])}
                        className="text-[11px] font-medium transition hover:text-sky-500"
                      >
                        {t("filters.clearAll")}
                      </button>
                    </div>
                    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                      {routes.map((route) => {
                        const enabled = effectiveEnabledRouteIds.includes(route.id);

                        return (
                          <button
                            key={route.id}
                            type="button"
                            onClick={() =>
                              setEnabledRouteIds((current) => toggleValue(current, route.id))
                            }
                            className={`rounded-full border px-3 py-2 text-left text-sm transition ${
                              enabled ? enabledCorridorChipClass : chipBaseClass
                            }`}
                          >
                            {getLocalizedText(route.name, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h2
                      className={`mb-2 text-xs uppercase tracking-[0.22em] ${subtleTextClass}`}
                    >
                      {t("filters.modes")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(TRANSPORT_MODE_META) as TransportMode[]).map((mode) => {
                        const enabled = enabledModes.includes(mode);

                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setEnabledModes((current) => toggleValue(current, mode))
                            }
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                              enabled ? "" : chipBaseClass
                            }`}
                            style={
                              enabled
                                ? {
                                    borderColor: `${TRANSPORT_MODE_META[mode].color}66`,
                                    backgroundColor: `${TRANSPORT_MODE_META[mode].color}18`,
                                    color: TRANSPORT_MODE_META[mode].color,
                                  }
                                : undefined
                            }
                          >
                            <ModeGlyph mode={mode} />
                            {t(TRANSPORT_MODE_META[mode].labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h2
                      className={`mb-2 text-xs uppercase tracking-[0.22em] ${subtleTextClass}`}
                    >
                      {t("filters.statuses")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_STATUSES.map((status) => {
                        const enabled = enabledStatuses.includes(status);

                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setEnabledStatuses((current) => toggleValue(current, status))
                            }
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              enabled
                                ? isDark
                                  ? "border-emerald-300/24 bg-emerald-300/10 text-emerald-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : chipBaseClass
                            }`}
                          >
                            {t(`status.${status}`)}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className={sectionCardClass}>
                    <div
                      className={`flex items-center gap-2 text-xs uppercase tracking-[0.22em] ${subtleTextClass}`}
                    >
                      <Route className="h-4 w-4" aria-hidden="true" />
                      {t("legend.title")}
                    </div>
                    <div className={`mt-3 grid gap-2 text-sm ${mutedTextClass}`}>
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-10 rounded-full bg-[#E8A838]" />
                        {t("mode.rail")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-10 rounded-full bg-[#3B8ED4]" />
                        {t("mode.ship")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="h-1.5 w-10 rounded-full bg-[#5CB85C]" />
                        {t("mode.road")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                            isDark
                              ? "bg-sky-300/20 text-sky-200"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          <Globe2 className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {t("legend.bakuPort")}
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div
                className={`pointer-events-auto rounded-[2rem] border p-5 backdrop-blur ${cardClass}`}
              >
                <p className={`max-w-2xl text-sm leading-7 sm:text-base ${mutedTextClass}`}>
                  {t("app.subtitle")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      isDark
                        ? "border-sky-300/16 bg-sky-400/12 text-sky-100"
                        : "border-sky-200 bg-sky-50 text-sky-800"
                    }`}
                  >
                    {t("app.seededRoutes", { count: visibleRoutes.length })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setResetCount((count) => count + 1)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t("controls.resetView")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFlowAnimation((current) => !current)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                  >
                    <Waves className="h-4 w-4" aria-hidden="true" />
                    {showFlowAnimation ? t("controls.hideFlow") : t("controls.showFlow")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapOnlyMode(true)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                  >
                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                    {t("controls.mapOnly")}
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden xl:block" />
          </div>
          </div>
        ) : null}

        <div className={`relative flex-1 ${isMapOnlyMode ? "pt-0" : "pt-[54rem] md:pt-[47rem] xl:pt-[14.5rem]"}`}>
          <div className="absolute inset-0">
            <CorridorMapCanvas
              routes={visibleRoutes}
              allRoutes={routes}
              markers={safeMarkers}
              selectedRouteId={activeSelectedRouteId}
              selectedSegmentId={activeSelectedSegmentId}
              hoveredRouteId={hoveredRouteId}
              locale={locale}
              theme={theme}
              showFlowAnimation={showFlowAnimation}
              resetCount={resetCount}
              isMapOnlyMode={isMapOnlyMode}
              onRouteSelect={handleRouteSelect}
              onRouteHover={setHoveredRouteId}
              onClearSelection={() => {
                setSelectedRouteId(null);
                setSelectedSegmentId(null);
                setHoveredRouteId(null);
              }}
              onPortCorridorSelect={handlePortCorridorSelect}
              t={t}
            />
          </div>

          {isMapOnlyMode ? (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-[470] flex justify-end xl:inset-x-6">
              <button
                type="button"
                onClick={() => setIsMapOnlyMode(false)}
                className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur transition ${buttonClass}`}
              >
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
                {t("controls.showInterface")}
              </button>
            </div>
          ) : null}

          {!isMapOnlyMode ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[450] flex justify-between gap-4 xl:inset-x-6">
            <div
              className={`pointer-events-auto hidden rounded-full border px-4 py-2 text-xs backdrop-blur md:block ${cardClass} ${mutedTextClass}`}
            >
              {t("map.customAttribution")}
            </div>
          </div>
          ) : null}

          <RouteDetailsPanel
            route={selectedRoute}
            locale={locale}
            theme={theme}
            isOpen={Boolean(selectedRoute)}
            selectedSegmentId={activeSelectedSegmentId}
            onClose={() => {
              setSelectedRouteId(null);
              setSelectedSegmentId(null);
            }}
            onSegmentSelect={setSelectedSegmentId}
            t={t}
          />

          {!isMapOnlyMode && !selectedRoute ? (
            <div
              className={`pointer-events-none absolute bottom-6 right-6 z-[440] hidden max-w-sm rounded-[1.75rem] border p-4 text-sm leading-7 shadow-xl backdrop-blur xl:block ${cardClass} ${mutedTextClass}`}
            >
              {t("panel.emptyBody")}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
