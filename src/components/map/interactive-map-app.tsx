"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
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
  X,
} from "lucide-react";

import "@/lib/i18n";
import {
  getCountryFlagEmoji,
  getLocalizedText,
  SUPPORTED_LOCALES,
  TRANSPORT_MODE_META,
} from "@/data/corridors";
import { getMarkerIconSvg } from "@/data/marker-icons";
import { RouteDetailsPanel } from "@/components/map/route-details-panel";
import type { AdminMarker, MarkerCategory } from "@/types/admin";
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

const TRANSPORT_MODE_ORDER: TransportMode[] = ["rail", "ship", "road"];
const STATUS_ORDER: CorridorStatus[] = ["active", "planned", "suspended"];

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

function getAvailableModes(routes: CorridorRoute[]) {
  return TRANSPORT_MODE_ORDER.filter((mode) =>
    routes.some((route) => route.segments.some((segment) => segment.mode === mode)),
  );
}

function getAvailableStatuses(routes: CorridorRoute[]) {
  return STATUS_ORDER.filter((status) => routes.some((route) => route.status === status));
}

function getUniqueRouteModes(route: CorridorRoute) {
  return TRANSPORT_MODE_ORDER.filter((mode) =>
    route.segments.some((segment) => segment.mode === mode),
  );
}

function MarkerLegendGlyph({
  category,
  icon,
  isDark,
}: {
  category: MarkerCategory;
  icon: string;
  isDark: boolean;
}) {
  const markerColorClass: Record<MarkerCategory, string> = {
    port: isDark ? "bg-sky-300/20 text-sky-100" : "bg-sky-100 text-sky-700",
    station: isDark ? "bg-amber-300/20 text-amber-100" : "bg-amber-100 text-amber-700",
    border: isDark ? "bg-pink-300/20 text-pink-100" : "bg-pink-100 text-pink-700",
    city: isDark ? "bg-emerald-300/20 text-emerald-100" : "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`marker-legend-icon inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${markerColorClass[category]}`}
      dangerouslySetInnerHTML={{ __html: getMarkerIconSvg(icon, category) }}
    />
  );
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
    () => routes.map((route) => route.id),
  );
  const [enabledModes, setEnabledModes] = useState<TransportMode[]>(
    () => getAvailableModes(routes),
  );
  const [enabledStatuses, setEnabledStatuses] = useState<CorridorStatus[]>(
    () => getAvailableStatuses(routes),
  );
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [resetCount, setResetCount] = useState(0);
  const [isMapOnlyMode, setIsMapOnlyMode] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const availableRouteIds = routes.map((route) => route.id);
  const availableModes = getAvailableModes(routes);
  const availableStatuses = getAvailableStatuses(routes);

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
  const effectiveEnabledModes = enabledModes.filter((mode) =>
    availableModes.includes(mode),
  );
  const effectiveEnabledStatuses = enabledStatuses.filter((status) =>
    availableStatuses.includes(status),
  );

  const visibleRoutes: CorridorRoute[] = routes.filter((route) => {
    if (
      !effectiveEnabledRouteIds.includes(route.id) ||
      !effectiveEnabledStatuses.includes(route.status)
    ) {
      return false;
    }

    return route.segments.some((segment) => effectiveEnabledModes.includes(segment.mode));
  }).map((route) => ({
    ...route,
    segments: route.segments.filter((segment) => effectiveEnabledModes.includes(segment.mode)),
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

  function handleResetView() {
    setSelectedRouteId(null);
    setSelectedSegmentId(null);
    setHoveredRouteId(null);
    setResetCount((count) => count + 1);
  }

  const isDark = theme === "dark";
  const pageClass = isDark
    ? "bg-[radial-gradient(circle_at_14%_-10%,_rgba(246,181,61,0.10),_transparent_40%),radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_46%),radial-gradient(circle_at_bottom,_rgba(20,184,166,0.12),_transparent_36%),linear-gradient(180deg,_#0c1c2e_0%,_#11283c_46%,_#15334a_100%)] text-slate-50"
    : "bg-[radial-gradient(circle_at_12%_-8%,_rgba(201,122,18,0.07),_transparent_38%),radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.11),_transparent_30%),linear-gradient(180deg,_#f4f8fc_0%,_#edf3f9_42%,_#e6edf6_100%)] text-slate-950";
  const gridClass = isDark
    ? "opacity-30 [background-image:linear-gradient(rgba(203,213,225,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.09)_1px,transparent_1px)]"
    : "opacity-45 [background-image:linear-gradient(rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.12)_1px,transparent_1px)]";
  const cardClass = isDark
    ? "border-white/12 bg-gradient-to-b from-slate-900/82 to-slate-950/82 shadow-[0_28px_70px_-30px_rgba(2,6,23,0.85)]"
    : "border-slate-200/70 bg-gradient-to-b from-white/95 to-white/82 shadow-[0_28px_70px_-34px_rgba(30,58,95,0.4)]";
  const buttonClass = isDark
    ? "border-white/14 bg-white/8 text-slate-100 hover:bg-white/16 hover:border-white/25"
    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-300";
  const mutedTextClass = isDark ? "text-slate-300" : "text-slate-600";
  const headingTextClass = isDark ? "text-white" : "text-slate-950";
  const subtleTextClass = isDark ? "text-slate-300" : "text-slate-500";
  const sectionCardClass = isDark
    ? "rounded-2xl border border-white/12 bg-white/7 p-3"
    : "rounded-2xl border border-slate-200 bg-slate-50/85 p-3";
  const chipBaseClass = isDark
    ? "border-white/12 bg-white/7 text-slate-200 hover:bg-white/12"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";
  const enabledCorridorChipClass = isDark
    ? "border-sky-200/35 bg-sky-300/18 text-sky-50"
    : "border-sky-200 bg-sky-50 text-sky-800";
  const selectClass = isDark
    ? "bg-slate-900 text-slate-100"
    : "bg-white text-slate-800";
  const sectionHeadingClass = `mb-2 flex items-center justify-between gap-3 border-b pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${
    isDark ? "border-white/10 text-slate-100" : "border-slate-200 text-slate-700"
  }`;
  const savedPortMarker =
    safeMarkers.find((marker) => marker.id === "baku-port") ??
    safeMarkers.find((marker) => marker.category === "port") ??
    null;
  const portLegendIcon = savedPortMarker?.icon ?? "fas:anchor";


  return (
    <main className={`relative h-screen overflow-hidden ${pageClass}`}>
      <div
        className={`pointer-events-none absolute inset-0 [background-position:center_center] [background-size:72px_72px] ${gridClass}`}
      />
      <div className="grain-overlay" aria-hidden="true" />

      {/* Map base layer */}
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

      {/* Top bar */}
      {!isMapOnlyMode ? (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-[470] p-3">
          <div
            className={`pointer-events-auto relative flex items-center justify-between gap-2 overflow-hidden rounded-2xl border px-3 py-2.5 backdrop-blur sm:px-4 ${cardClass}`}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70"
              aria-hidden="true"
            />
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--accent-strong)] sm:flex"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--accent) 16%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 34%, transparent)",
                }}
                aria-hidden="true"
              >
                <ShipWheel className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-label flex items-center gap-1.5 text-[0.6rem] uppercase text-[var(--accent)]">
                  <span className="accent-pulse" aria-hidden="true" />
                  <span className="truncate">{t("app.eyebrow")}</span>
                </p>
                <h1
                  className={`font-display truncate text-base font-semibold leading-tight sm:text-lg ${headingTextClass}`}
                >
                  {t("app.title")}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFiltersOpen((current) => !current)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition lg:hidden ${buttonClass}`}
                aria-expanded={isFiltersOpen}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("filters.title")}</span>
              </button>

              <label
                className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-sm sm:flex ${buttonClass}`}
              >
                <Globe2 className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                <select
                  aria-label="Language"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as SupportedLocale)}
                  className={`appearance-none rounded-full border-0 bg-transparent py-0 pr-1 outline-none ${selectClass}`}
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
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${buttonClass}`}
                aria-label={isDark ? t("controls.switchToLight") : t("controls.switchToDark")}
                title={isDark ? t("controls.switchToLight") : t("controls.switchToDark")}
              >
                {isDark ? (
                  <SunMedium className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <MoonStar className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMapOnlyMode(true)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${buttonClass}`}
                title={t("controls.mapOnly")}
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{t("controls.mapOnly")}</span>
              </button>
            </div>
          </div>
        </header>
      ) : null}

      {/* Filters panel (left) */}
      {!isMapOnlyMode ? (
        <aside
          className={`pointer-events-auto absolute bottom-3 left-3 top-[5.5rem] z-[460] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border backdrop-blur transition-transform duration-300 ${cardClass} ${
            isFiltersOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.25rem)]"
          } lg:translate-x-0`}
          aria-label={t("filters.title")}
        >
          <div
            className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${
              isDark ? "border-white/10" : "border-slate-200"
            }`}
          >
            <div
              className={`font-label flex items-center gap-2 text-xs uppercase ${
                isDark ? "text-slate-100" : "text-slate-700"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {t("filters.title")}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="font-label inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem]"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--accent) 14%, transparent)",
                  color: "var(--accent-strong)",
                }}
              >
                {visibleRoutes.length}/{routes.length}
              </span>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition lg:hidden ${buttonClass}`}
                aria-label={t("filters.collapse")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className={`flex flex-wrap items-center gap-2 border-b px-4 py-2.5 ${
              isDark ? "border-white/10" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={handleResetView}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${buttonClass}`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("controls.resetView")}
            </button>
            <button
              type="button"
              onClick={() => setShowFlowAnimation((current) => !current)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${buttonClass}`}
              aria-pressed={showFlowAnimation}
            >
              <Waves className="h-3.5 w-3.5" aria-hidden="true" />
              {showFlowAnimation ? t("controls.hideFlow") : t("controls.showFlow")}
            </button>
            <button
              type="button"
              onClick={() => {
                setEnabledRouteIds(availableRouteIds);
                setEnabledModes(availableModes);
                setEnabledStatuses(availableStatuses);
              }}
              className="ml-auto text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
            >
              {t("filters.enableAll")}
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <section>
              <div className={sectionHeadingClass}>
                <span>{t("filters.corridors")}</span>
                <button
                  type="button"
                  onClick={() => setEnabledRouteIds([])}
                  className="text-[11px] font-medium transition hover:text-[var(--accent)]"
                >
                  {t("filters.clearAll")}
                </button>
              </div>
              <div className="grid gap-2">
                {routes.map((route) => {
                  const enabled = effectiveEnabledRouteIds.includes(route.id);
                  const routeModes = getUniqueRouteModes(route);
                  const routeFlags = route.countries
                    .slice(0, 7)
                    .map((countryCode) => getCountryFlagEmoji(countryCode))
                    .join(" ");

                  return (
                    <div
                      key={route.id}
                      className={`flex items-center gap-2 rounded-2xl border p-2 transition ${
                        enabled ? enabledCorridorChipClass : chipBaseClass
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handlePortCorridorSelect(route.id)}
                        className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: route.routeColor }}
                          />
                          <span
                            className={`truncate text-sm font-semibold ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {getLocalizedText(route.name, locale)}
                          </span>
                        </span>
                        <span
                          className={`mt-1 flex min-w-0 items-center gap-2 text-xs ${mutedTextClass}`}
                        >
                          <span className="truncate" aria-hidden="true">
                            {routeFlags}
                          </span>
                          <span className="flex shrink-0 items-center gap-1">
                            {routeModes.map((mode) => (
                              <span
                                key={mode}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor: `${TRANSPORT_MODE_META[mode].color}22`,
                                  color: TRANSPORT_MODE_META[mode].color,
                                }}
                              >
                                <ModeGlyph mode={mode} />
                              </span>
                            ))}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEnabledRouteIds((current) => toggleValue(current, route.id))
                        }
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${buttonClass}`}
                        aria-pressed={enabled}
                        aria-label={`${
                          enabled ? t("filters.hideCorridor") : t("filters.showCorridor")
                        }: ${getLocalizedText(route.name, locale)}`}
                      >
                        {enabled ? (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {availableModes.length > 0 ? (
              <section>
                <h2 className={sectionHeadingClass}>
                  <span>{t("filters.modes")}</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {availableModes.map((mode) => {
                    const enabled = effectiveEnabledModes.includes(mode);

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
            ) : null}

            {availableStatuses.length > 0 ? (
              <section>
                <h2 className={sectionHeadingClass}>
                  <span>{t("filters.statuses")}</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => {
                    const enabled = effectiveEnabledStatuses.includes(status);
                    const count = routes.filter((route) => route.status === status).length;

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
                        {t(`status.${status}`)} <span className="opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className={sectionCardClass}>
              <div
                className={`font-label flex items-center gap-2 text-xs uppercase ${
                  isDark ? "text-slate-100" : "text-slate-700"
                }`}
              >
                <Route className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                {t("legend.title")}
              </div>
              <div className={`mt-3 grid gap-4 text-sm ${mutedTextClass}`}>
                <div>
                  <h3
                    className={`font-label mb-2 text-[0.7rem] uppercase ${subtleTextClass}`}
                  >
                    {t("legend.corridorColors")}
                  </h3>
                  <div className="grid gap-2">
                    {routes.map((route) => (
                      <div key={route.id} className="flex items-center gap-3">
                        <span
                          className="h-1.5 w-10 shrink-0 rounded-full"
                          style={{ backgroundColor: route.routeColor }}
                        />
                        <span className="truncate">
                          {getLocalizedText(route.name, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3
                    className={`font-label mb-2 text-[0.7rem] uppercase ${subtleTextClass}`}
                  >
                    {t("legend.transportModes")}
                  </h3>
                  <div className="grid gap-2">
                    {availableModes.map((mode) => (
                      <div key={mode} className="flex items-center gap-3">
                        <span
                          className="h-1.5 w-10 shrink-0 rounded-full"
                          style={{ backgroundColor: TRANSPORT_MODE_META[mode].color }}
                        />
                        {t(TRANSPORT_MODE_META[mode].labelKey)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3
                    className={`font-label mb-2 text-[0.7rem] uppercase ${subtleTextClass}`}
                  >
                    {t("legend.markers")}
                  </h3>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3">
                      <MarkerLegendGlyph category="port" icon={portLegendIcon} isDark={isDark} />
                      {t("legend.bakuPort")}
                    </div>
                    <div className="flex items-center gap-3">
                      <MarkerLegendGlyph category="station" icon="fas:train" isDark={isDark} />
                      {t("mode.rail")}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>
      ) : null}

      {/* Route details (right) */}
      <RouteDetailsPanel
        route={selectedRoute}
        locale={locale}
        theme={theme}
        isOpen={Boolean(selectedRoute)}
        isMapOnlyMode={isMapOnlyMode}
        selectedSegmentId={activeSelectedSegmentId}
        onClose={() => {
          setSelectedRouteId(null);
          setSelectedSegmentId(null);
        }}
        onResetView={handleResetView}
        onSegmentSelect={setSelectedSegmentId}
        t={t}
      />

      {/* Map-only exit */}
      {isMapOnlyMode ? (
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[470] flex justify-end">
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

      {/* Attribution */}
      {!isMapOnlyMode ? (
        <div
          className={`pointer-events-none absolute bottom-3 left-1/2 z-[440] hidden -translate-x-1/2 rounded-full border px-3 py-1.5 text-[0.7rem] backdrop-blur lg:block ${cardClass} ${mutedTextClass}`}
        >
          {t("map.customAttribution")}
        </div>
      ) : null}
    </main>
  );
}
