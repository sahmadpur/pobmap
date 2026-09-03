"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  Globe2,
  Layers,
  Maximize2,
  Minimize2,
  MoonStar,
  Route,
  ShipWheel,
  SlidersHorizontal,
  SunMedium,
  TrainFront,
  Truck,
  X,
} from "lucide-react";

import "@/lib/i18n";
import {
  getCorridorKeyCountries,
  getCountryName,
  getLocalizedText,
  SUPPORTED_LOCALES,
  TRANSPORT_MODE_META,
} from "@/data/corridors";
import { getMarkerIconSvg } from "@/data/marker-icons";
import { getSegmentRenderCoordinates } from "@/lib/map-utils";
import { CountryFlag } from "@/components/ui/country-flag";
import { RouteDetailsPanel } from "@/components/map/route-details-panel";
import type { AdminMarker, MarkerCategory } from "@/types/admin";
import type {
  Coordinate,
  CorridorRoute,
  CorridorSegment,
  CorridorStatus,
  SupportedLocale,
  TransportMode,
} from "@/types/map";

const CorridorMapCanvas = dynamic(() => import("@/components/map/corridor-map-canvas"), {
  ssr: false,
});

type Basemap = "default" | "styled";

/** Pickable in light theme; dark theme always uses the night palette. */
const BASEMAPS: Basemap[] = ["default", "styled"];

// Google map tiles with every label hidden except country names, compiled to
// the tile endpoint's `apistyle` encoding: rules are comma-separated,
// `s.t:17` = administrative.country (5 landscape, 49 highway, 6 water),
// `s.e` = element (l labels, l.t labels.text, g geometry, g.s geometry.stroke),
// `p.v` = visibility, `p.c` = color aarrggbb. `|` is pre-URL-encoded.
const COUNTRIES_ONLY = ["s.e:l%7Cp.v:off", "s.t:17%7Cs.e:l.t%7Cp.v:on"];

const BASEMAP_APISTYLE: Record<Basemap | "dark", string> = {
  default: COUNTRIES_ONLY.join(","),
  // Grey labels, cream landscape, light roads, blue water.
  styled: [
    ...COUNTRIES_ONLY,
    "s.t:17%7Cs.e:l.t.f%7Cp.c:%23ff878787",
    "s.t:17%7Cs.e:l.t.s%7Cp.v:off",
    "s.t:5%7Cp.c:%23fff9f5ed",
    "s.t:49%7Cp.c:%23fff5f5f5",
    "s.t:49%7Cs.e:g.s%7Cp.c:%23ffc9c9c9",
    "s.t:6%7Cp.c:%23ffaee0f4",
  ].join(","),
  // Google's night palette: slate land, darker water and roads, muted labels.
  dark: [
    ...COUNTRIES_ONLY,
    "s.e:g%7Cp.c:%23ff242f3e",
    "s.t:17%7Cs.e:l.t.f%7Cp.c:%23ff9aa5b4",
    "s.t:17%7Cs.e:l.t.s%7Cp.c:%23ff242f3e",
    "s.t:49%7Cs.e:g%7Cp.c:%23ff38414e",
    "s.t:49%7Cs.e:g.s%7Cp.c:%23ff212a37",
    "s.t:6%7Cs.e:g%7Cp.c:%23ff17263c",
  ].join(","),
};

function basemapTileUrl(basemap: Basemap | "dark", locale: SupportedLocale) {
  return `https://mt{s}.google.com/vt/lyrs=m&hl=${locale}&x={x}&y={y}&z={z}&apistyle=${BASEMAP_APISTYLE[basemap]}`;
}

/** One real tile over the Caspian (z5) as the selector thumbnail. */
function basemapPreviewUrl(basemap: Basemap, locale: SupportedLocale) {
  return basemapTileUrl(basemap, locale)
    .replace("{s}", "0")
    .replace("{x}", "20")
    .replace("{y}", "12")
    .replace("{z}", "5");
}

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
  const [basemap, setBasemap] = useState<Basemap>("default");
  const [isBasemapPickerOpen, setIsBasemapPickerOpen] = useState(false);
  const [locale, setLocale] = useState<SupportedLocale>("az");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  // Closing the details panel keeps the route selected; any new selection reopens it.
  const [isRoutePanelHidden, setIsRoutePanelHidden] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  // Corridors start hidden: the map opens on the Baku Port hub alone, and a
  // corridor's line, markers and stops appear only once it is picked here or via
  // the hub popup. Modes and statuses stay fully enabled — they refine a chosen
  // corridor rather than acting as the primary selector.
  const [enabledRouteIds, setEnabledRouteIds] = useState<string[]>([]);
  const [enabledModes, setEnabledModes] = useState<TransportMode[]>(
    () => getAvailableModes(routes),
  );
  const [enabledStatuses, setEnabledStatuses] = useState<CorridorStatus[]>(
    () => getAvailableStatuses(routes),
  );
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [frameCount, setFrameCount] = useState(0);
  // Segments of the group opened in the details panel; empty means no group is
  // open, in which case the whole corridor stays lit.
  const [groupSegmentIds, setGroupSegmentIds] = useState<string[]>([]);
  const [frameCoordinates, setFrameCoordinates] = useState<Coordinate[] | null>(null);
  const [isMapOnlyMode, setIsMapOnlyMode] = useState(false);
  // Open on desktop, closed on the narrow layout where it covers the map.
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const availableRouteIds = useMemo(() => routes.map((route) => route.id), [routes]);
  const availableModes = useMemo(() => getAvailableModes(routes), [routes]);
  const availableStatuses = useMemo(() => getAvailableStatuses(routes), [routes]);

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

      // The panel floats over the map, so it only starts open where there is
      // room for it beside the corridors.
      const desktop = window.matchMedia("(min-width: 1024px)").matches;

      setIsFiltersOpen(desktop);
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

  const effectiveEnabledRouteIds = useMemo(() => {
    if (enabledRouteIds.length === 0) {
      return [];
    }

    return enabledRouteIds.filter((routeId) => availableRouteIds.includes(routeId));
  }, [availableRouteIds, enabledRouteIds]);
  const effectiveEnabledModes = useMemo(
    () => enabledModes.filter((mode) => availableModes.includes(mode)),
    [availableModes, enabledModes],
  );
  const effectiveEnabledStatuses = useMemo(
    () => enabledStatuses.filter((status) => availableStatuses.includes(status)),
    [availableStatuses, enabledStatuses],
  );

  // Memoized so the route objects keep a stable identity across unrelated
  // re-renders (hover, theme, locale) — downstream effects (map fitBounds,
  // vehicle spawning) depend on it and must not re-run spuriously.
  const visibleRoutes: CorridorRoute[] = useMemo(() =>
    routes.filter((route) => {
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
    })),
  [routes, effectiveEnabledRouteIds, effectiveEnabledModes, effectiveEnabledStatuses]);

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

  // Selecting never moves the camera: clicking a line used to re-frame its whole
  // corridor, which threw away the zoom the user had set. Framing is now an
  // explicit request, made only by the jumps below.
  function handleRouteSelect(routeId: string, segmentId: string | null = null) {
    setIsRoutePanelHidden(false);

    if (selectedRouteId !== routeId) {
      setSelectedRouteId(routeId);
      setSelectedSegmentId(null);
      setGroupSegmentIds([]);
      return;
    }

    setSelectedRouteId(routeId);
    setSelectedSegmentId(segmentId);

    // Picking a segment outside the open panel group lifts the group's dimming
    // so the whole corridor is back in view around the new selection.
    if (segmentId && groupSegmentIds.length > 0 && !groupSegmentIds.includes(segmentId)) {
      setGroupSegmentIds([]);
    }
  }

  function handleGroupOpen(
    group: { id: string; segments: CorridorSegment[] } | null,
  ) {
    if (!group) {
      setGroupSegmentIds([]);
      return;
    }

    setGroupSegmentIds(group.segments.map((segment) => segment.id));
    setFrameCoordinates(
      group.segments.flatMap((segment) => getSegmentRenderCoordinates(segment)),
    );
    setFrameCount((count) => count + 1);
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
    // Jumping in from a port popup is a deliberate "show me this corridor", so
    // this is one of the few places that does frame the map.
    setFrameCoordinates(null);
    setFrameCount((count) => count + 1);
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
  // Native <option> popups on Windows render with the OS default background
  // and don't inherit Tailwind classes, so set explicit colors inline.
  const optionBgColor = isDark ? "#0f172a" : "#ffffff";
  const optionTextColor = isDark ? "#f1f5f9" : "#1e293b";
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
          frameCount={frameCount}
          frameCoordinates={frameCoordinates}
          groupSegmentIds={groupSegmentIds}
          isMapOnlyMode={isMapOnlyMode}
          tileUrl={basemapTileUrl(isDark ? "dark" : basemap, locale)}
          hasFilterPanel={isFiltersOpen && !isMapOnlyMode}
          onRouteSelect={(routeId, segmentId) => {
            // Picking a corridor on the map gets the filters out of the way;
            // picking one from a filter row leaves the panel where it is.
            setIsFiltersOpen(false);
            handleRouteSelect(routeId, segmentId);
          }}
          onRouteHover={setHoveredRouteId}
          onClearSelection={() => {
            setSelectedRouteId(null);
            setSelectedSegmentId(null);
            setHoveredRouteId(null);
            setGroupSegmentIds([]);
          }}
          onPortCorridorSelect={(routeId) => {
            setIsFiltersOpen(false);
            handlePortCorridorSelect(routeId);
          }}
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
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${buttonClass}`}
                aria-expanded={isFiltersOpen}
                aria-label={t(isFiltersOpen ? "filters.collapse" : "filters.expand")}
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
                  style={{ color: optionTextColor }}
                >
                  {SUPPORTED_LOCALES.map((language) => (
                    <option
                      key={language}
                      value={language}
                      style={{ backgroundColor: optionBgColor, color: optionTextColor }}
                    >
                      {LOCALE_LABELS[language]}
                    </option>
                  ))}
                </select>
              </label>

              {!isDark ? (
                <button
                  type="button"
                  onClick={() => setIsBasemapPickerOpen((current) => !current)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${buttonClass}`}
                  aria-label={t("basemap.title")}
                  title={t("basemap.title")}
                  aria-expanded={isBasemapPickerOpen}
                >
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}

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

      {/* Map type picker (right, under header) */}
      {!isMapOnlyMode && !isDark && isBasemapPickerOpen ? (
        <section
          className={`pointer-events-auto absolute right-16 top-[5.5rem] z-[470] w-max rounded-2xl border p-4 backdrop-blur ${cardClass}`}
          aria-label={t("basemap.title")}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-base font-semibold ${headingTextClass}`}>{t("basemap.title")}</h2>
            <button
              type="button"
              onClick={() => setIsBasemapPickerOpen(false)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${mutedTextClass} hover:bg-slate-500/10`}
              aria-label={t("basemap.close")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex gap-4">
            {BASEMAPS.map((option) => {
              const isActive = option === basemap;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBasemap(option)}
                  className="flex flex-col items-center gap-2 text-sm font-medium"
                  aria-pressed={isActive}
                >
                  <span
                    className={`overflow-hidden rounded-xl border-[3px] transition ${
                      isActive ? "border-[var(--accent)]" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={basemapPreviewUrl(option, locale)}
                      alt=""
                      width={72}
                      height={72}
                      className="block h-[4.5rem] w-[4.5rem] object-cover"
                    />
                  </span>
                  <span className={isActive ? "text-[var(--accent)]" : mutedTextClass}>
                    {t(`basemap.${option}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Filters panel (left) */}
      {!isMapOnlyMode ? (
        <aside
          className={`pointer-events-auto absolute bottom-3 left-3 top-[5.5rem] z-[460] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border backdrop-blur transition-transform duration-300 ${cardClass} ${
            isFiltersOpen ? "translate-x-0" : "-translate-x-[calc(100%+1.25rem)]"
          }`}
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
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${buttonClass}`}
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
              onClick={() => setShowFlowAnimation((current) => !current)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${buttonClass}`}
              aria-pressed={showFlowAnimation}
            >
              {showFlowAnimation ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {showFlowAnimation ? t("controls.hideFlow") : t("controls.showFlow")}
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <section>
              <div className={sectionHeadingClass}>
                <span>{t("filters.corridors")}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (visibleRoutes.length === routes.length) {
                      setEnabledRouteIds([]);
                      return;
                    }

                    setEnabledRouteIds(availableRouteIds);
                    setEnabledModes(availableModes);
                    setEnabledStatuses(availableStatuses);
                  }}
                  className="text-[11px] font-medium text-[var(--accent)] transition hover:opacity-80"
                >
                  {visibleRoutes.length === routes.length
                    ? t("filters.clearAll")
                    : t("filters.enableAll")}
                </button>
              </div>
              <div className="grid gap-2">
                {routes.map((route) => {
                  const enabled = effectiveEnabledRouteIds.includes(route.id);
                  const routeModes = getUniqueRouteModes(route);
                  const routeFlags = getCorridorKeyCountries(route);

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
                          <span className="flex shrink-0 items-center gap-1">
                            {routeFlags.map((countryCode) => (
                              <CountryFlag
                                key={countryCode}
                                code={countryCode}
                                size={20}
                                title={getCountryName(countryCode, locale)}
                              />
                            ))}
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
        isOpen={Boolean(selectedRoute) && !isRoutePanelHidden}
        isMapOnlyMode={isMapOnlyMode}
        selectedSegmentId={activeSelectedSegmentId}
        onClose={() => setIsRoutePanelHidden(true)}
        onSegmentSelect={setSelectedSegmentId}
        onGroupOpen={handleGroupOpen}
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

    </main>
  );
}
