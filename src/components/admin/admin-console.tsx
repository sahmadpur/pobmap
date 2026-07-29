"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  LogOut,
  MapPinned,
  Plus,
  Route,
  Save,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { COUNTRY_NAMES, getCountryFlagEmoji } from "@/data/corridors";
import {
  DEFAULT_MARKER_ICON_BY_CATEGORY,
  FEATURED_MARKER_ICON_IDS,
  getMarkerIconSvg,
  isDefaultMarkerIconForCategory,
  MARKER_ICON_OPTIONS,
} from "@/data/marker-icons";
import {
  getTransportStop,
  getTransportStopCountryLabel,
  getTransportStopLabel,
  searchTransportStops,
} from "@/data/transport-stops";
import { applyStopIdsToSegment, inferStopIdsFromCoordinates } from "@/lib/corridor-stop-utils";
import type { AdminMarker } from "@/types/admin";
import type { CorridorRoute, CorridorSegment, LocalizedText } from "@/types/map";

const SegmentLineEditor = dynamic(
  () => import("@/components/admin/segment-line-editor").then((mod) => mod.SegmentLineEditor),
  {
    ssr: false,
    loading: () => (
      <div className="hc-inset p-4 text-xs text-[var(--hc-muted)]">Loading map editor…</div>
    ),
  },
);

type Register = "routes" | "markers";

function emptyLocalizedText(): LocalizedText {
  return { az: "", en: "", ru: "" };
}

const COUNTRY_OPTIONS = Object.entries(COUNTRY_NAMES)
  .map(([code, name]) => ({
    code,
    name,
  }))
  .sort((first, second) => first.name.en.localeCompare(second.name.en));

function createSegmentLabelsFromStops(stopIds: string[]): Pick<CorridorSegment, "from" | "to"> {
  const firstStop = getTransportStop(stopIds[0]);
  const lastStop = getTransportStop(stopIds[stopIds.length - 1]);

  return {
    from: firstStop?.name ?? emptyLocalizedText(),
    to: lastStop?.name ?? emptyLocalizedText(),
  };
}

function createEmptySegment(): CorridorSegment {
  return {
    id: `segment-${crypto.randomUUID()}`,
    mode: "rail",
    from: emptyLocalizedText(),
    to: emptyLocalizedText(),
    distanceKm: 0,
    coordinates: [],
    stopIds: [],
  };
}

function createEmptyRoute(): CorridorRoute {
  return {
    id: `route-${crypto.randomUUID()}`,
    name: emptyLocalizedText(),
    routeColor: "#0f172a",
    type: "primary",
    totalDistanceKm: 0,
    transitTime: emptyLocalizedText(),
    countries: ["AZ"],
    description: emptyLocalizedText(),
    status: "active",
    animationSpeed: 0.1,
    segments: [createEmptySegment()],
  };
}

function createEmptyMarker(): AdminMarker {
  return {
    id: `marker-${crypto.randomUUID()}`,
    name: emptyLocalizedText(),
    description: emptyLocalizedText(),
    category: "port",
    icon: DEFAULT_MARKER_ICON_BY_CATEGORY.port,
    coordinates: [40.3572, 49.835],
    connectedCorridorIds: [],
  };
}

/** Section header used inside every editor panel. */
function PanelHead({
  eyebrow,
  title,
  hint,
  count,
}: {
  eyebrow: string;
  title?: string;
  hint?: string;
  count?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="hc-eyebrow">{eyebrow}</p>
        {title ? <p className="mt-1 text-sm font-semibold text-[var(--hc-text)]">{title}</p> : null}
        {hint ? <p className="mt-1 text-sm text-[var(--hc-muted)]">{hint}</p> : null}
      </div>
      {count ? (
        <span className="hc-mono shrink-0 rounded-full border border-[var(--hc-line)] px-2.5 py-1 text-xs text-[var(--hc-muted)]">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function StopPathEditor({
  segment,
  onChange,
}: {
  segment: CorridorSegment;
  onChange: (segment: CorridorSegment) => void;
}) {
  const [query, setQuery] = useState("");
  const stopIds = segment.stopIds ?? inferStopIdsFromCoordinates(segment.coordinates) ?? [];
  const results = searchTransportStops(query);

  function updateStopIds(nextStopIds: string[]) {
    onChange(
      applyStopIdsToSegment({
        ...segment,
        stopIds: nextStopIds,
      }),
    );
  }

  function applyStopLabels() {
    if (stopIds.length < 2) {
      return;
    }

    onChange({
      ...applyStopIdsToSegment({
        ...segment,
        stopIds,
      }),
      ...createSegmentLabelsFromStops(stopIds),
    });
  }

  return (
    <div className="hc-inset p-4">
      <PanelHead
        eyebrow="Stops & waypoints"
        hint="Search the city catalog — the map path rebuilds from stop order."
        count={`${segment.coordinates.length} pts`}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--hc-line)] bg-[var(--hc-panel)] px-3 py-2">
        <p className="text-xs text-[var(--hc-muted)]">Coordinates follow the stop sequence below.</p>
        <button type="button" onClick={applyStopLabels} className="hc-btn hc-btn--xs">
          Use stop names for From/To
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {stopIds.map((stopId, index) => {
          const stop = getTransportStop(stopId);

          if (!stop) {
            return null;
          }

          return (
            <div
              key={`${segment.id}-${stopId}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--hc-line)] bg-[var(--hc-panel)] px-3 py-2.5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="hc-index">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                    {getTransportStopLabel(stop, "en")}
                  </p>
                  <p className="text-xs text-[var(--hc-muted)]">
                    {getTransportStopCountryLabel(stop, "en")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (index === 0) {
                      return;
                    }

                    const nextStopIds = [...stopIds];
                    [nextStopIds[index - 1], nextStopIds[index]] = [
                      nextStopIds[index],
                      nextStopIds[index - 1],
                    ];
                    updateStopIds(nextStopIds);
                  }}
                  disabled={index === 0}
                  className="hc-btn hc-btn--xs"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (index === stopIds.length - 1) {
                      return;
                    }

                    const nextStopIds = [...stopIds];
                    [nextStopIds[index], nextStopIds[index + 1]] = [
                      nextStopIds[index + 1],
                      nextStopIds[index],
                    ];
                    updateStopIds(nextStopIds);
                  }}
                  disabled={index === stopIds.length - 1}
                  className="hc-btn hc-btn--xs"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Remove this stop from the segment?")) {
                      return;
                    }

                    updateStopIds(stopIds.filter((_, stopIndex) => stopIndex !== index));
                  }}
                  className="hc-btn hc-btn--xs hc-btn--danger"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <label className="mt-4 block rounded-lg border border-dashed border-[var(--hc-line-strong)] bg-[var(--hc-panel)] p-3">
        <span className="hc-label mb-2">Add stop</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city or country"
          className="hc-field"
        />

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {results.map((stop) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => {
                updateStopIds([...stopIds, stop.id]);
                setQuery("");
              }}
              className="flex items-center justify-between rounded-lg border border-[var(--hc-line)] bg-[var(--hc-panel-2)] px-3 py-2 text-left transition hover:border-[var(--hc-line-strong)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                  {getTransportStopLabel(stop, "en")}
                </p>
                <p className="text-xs text-[var(--hc-muted)]">
                  {getTransportStopCountryLabel(stop, "en")}
                </p>
              </div>
              <span className="rounded-full bg-[var(--hc-amber)] px-2.5 py-1 text-xs font-semibold text-[#1a1206]">
                Add
              </span>
            </button>
          ))}
        </div>
      </label>
    </div>
  );
}

function CountrySelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const selectedCodes = new Set(value);
  const results = COUNTRY_OPTIONS.filter((country) => {
    const searchable = [
      country.code,
      country.name.az,
      country.name.en,
      country.name.ru,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return searchable.includes(query.trim().toLocaleLowerCase());
  }).slice(0, 12);

  return (
    <div className="hc-inset p-4">
      <PanelHead
        eyebrow="Countries"
        hint="Search and tag the corridor's countries."
        count={`${value.length} tagged`}
      />

      {value.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {value.map((countryCode) => {
            const country = COUNTRY_NAMES[countryCode];

            return (
              <button
                key={countryCode}
                type="button"
                onClick={() => onChange(value.filter((code) => code !== countryCode))}
                className="hc-chip"
              >
                <span aria-hidden="true">{getCountryFlagEmoji(countryCode)}</span>
                <span>{country?.en ?? countryCode}</span>
                <span className="text-[var(--hc-faint)]">×</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <label className="mt-4 block">
        <span className="hc-label mb-2">Add country</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search country or code"
          className="hc-field"
        />
      </label>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {results.map((country) => {
          const isSelected = selectedCodes.has(country.code);

          return (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                if (isSelected) {
                  return;
                }

                onChange([...value, country.code]);
                setQuery("");
              }}
              disabled={isSelected}
              className="flex items-center justify-between rounded-lg border border-[var(--hc-line)] bg-[var(--hc-panel-2)] px-3 py-2 text-left transition hover:border-[var(--hc-line-strong)] disabled:opacity-60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                  {getCountryFlagEmoji(country.code)} {country.name.en}
                </p>
                <p className="hc-mono text-xs text-[var(--hc-muted)]">{country.code}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isSelected
                    ? "bg-[rgba(92,198,232,0.16)] text-[var(--hc-cyan)]"
                    : "bg-[var(--hc-amber)] text-[#1a1206]"
                }`}
              >
                {isSelected ? "Tagged" : "Add"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LocalizedInputs({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
}) {
  const InputTag = multiline ? "textarea" : "input";

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(["az", "en", "ru"] as const).map((language) => (
        <label key={language} className="block">
          <span className="hc-label mb-2">
            {label} · {language.toUpperCase()}
          </span>
          <InputTag
            value={value[language]}
            onChange={(event) =>
              onChange({
                ...value,
                [language]: event.currentTarget.value,
              })
            }
            rows={multiline ? 4 : undefined}
            className="hc-field"
          />
        </label>
      ))}
    </div>
  );
}

function MarkerIconSelector({
  value,
  category,
  onChange,
}: {
  value: string;
  category: AdminMarker["category"];
  onChange: (nextValue: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const results = normalizedQuery
    ? MARKER_ICON_OPTIONS.filter((option) => option.searchText.includes(normalizedQuery)).slice(
        0,
        48,
      )
    : FEATURED_MARKER_ICON_IDS.map((iconId) =>
        MARKER_ICON_OPTIONS.find((option) => option.id === iconId),
      ).filter((option): option is NonNullable<typeof option> => Boolean(option));

  return (
    <div className="hc-inset p-4">
      <div className="flex items-start justify-between gap-3">
        <PanelHead eyebrow="Marker icon" hint="Pick the glyph shown on the map pin." />
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[rgba(246,181,61,0.4)] bg-[rgba(246,181,61,0.14)] text-[var(--hc-amber-strong)] [&_svg]:h-6 [&_svg]:w-6"
          dangerouslySetInnerHTML={{
            __html: getMarkerIconSvg(value, category),
          }}
        />
      </div>

      <label className="mt-4 block">
        <span className="hc-label mb-2">Search icons</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Font Awesome Free icons"
          className="hc-field"
        />
      </label>

      <p className="mt-3 text-xs text-[var(--hc-muted)]">
        {normalizedQuery
          ? `${results.length} matches for "${query}".`
          : "Featured icons — search to browse the full Font Awesome Free catalog."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((option) => {
          const isSelected = option.id === value;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                isSelected
                  ? "border-[rgba(246,181,61,0.45)] bg-[rgba(246,181,61,0.1)]"
                  : "border-[var(--hc-line)] bg-[var(--hc-panel-2)] hover:border-[var(--hc-line-strong)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg [&_svg]:h-5 [&_svg]:w-5 ${
                    isSelected
                      ? "bg-[var(--hc-amber)] text-[#1a1206]"
                      : "bg-[var(--hc-panel)] text-[var(--hc-muted)]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: option.svg }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                    {option.label}
                  </p>
                  <p className="hc-mono truncate text-xs text-[var(--hc-muted)]">
                    {option.style} · {option.id}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectedCorridorsSelector({
  routes,
  value,
  onChange,
}: {
  routes: CorridorRoute[];
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedIds = new Set(value);
  const results = routes.filter((route) => {
    const searchable = [route.id, route.name.az, route.name.en, route.name.ru]
      .join(" ")
      .toLocaleLowerCase();

    return searchable.includes(query.trim().toLocaleLowerCase());
  });

  return (
    <div className="hc-inset p-4">
      <PanelHead
        eyebrow="Connected corridors"
        hint="Link this marker to routes in the catalog."
        count={`${value.length} linked`}
      />

      {value.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {value.map((routeId) => {
            const route = routes.find((item) => item.id === routeId);
            const label = route?.name.en || routeId;

            return (
              <button
                key={routeId}
                type="button"
                onClick={() => onChange(value.filter((id) => id !== routeId))}
                className="hc-chip"
              >
                <span>{label}</span>
                <span className="text-[var(--hc-faint)]">×</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <label className="mt-4 block">
        <span className="hc-label mb-2">Add corridor</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search route name or ID"
          className="hc-field"
        />
      </label>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {results.map((route) => {
          const isSelected = selectedIds.has(route.id);

          return (
            <button
              key={route.id}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onChange(value.filter((id) => id !== route.id));
                  return;
                }

                onChange([...value, route.id]);
              }}
              className="flex items-center justify-between rounded-lg border border-[var(--hc-line)] bg-[var(--hc-panel-2)] px-3 py-2 text-left transition hover:border-[var(--hc-line-strong)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                  {route.name.en || route.id}
                </p>
                <p className="hc-mono truncate text-xs text-[var(--hc-muted)]">{route.id}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isSelected
                    ? "bg-[rgba(92,198,232,0.16)] text-[var(--hc-cyan)]"
                    : "bg-[var(--hc-amber)] text-[#1a1206]"
                }`}
              >
                {isSelected ? "Linked" : "Add"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminConsole() {
  const router = useRouter();
  const [routes, setRoutes] = useState<CorridorRoute[]>([]);
  const [markers, setMarkers] = useState<AdminMarker[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [persistedRouteIds, setPersistedRouteIds] = useState<string[]>([]);
  const [persistedMarkerIds, setPersistedMarkerIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [expandedSegmentIds, setExpandedSegmentIds] = useState<string[]>([]);
  const [activeRegister, setActiveRegister] = useState<Register>("routes");

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/routes").then((response) => response.json()),
      fetch("/api/admin/markers").then((response) => response.json()),
    ]).then(([routesPayload, markersPayload]) => {
      setRoutes(routesPayload as CorridorRoute[]);
      setMarkers(markersPayload as AdminMarker[]);
      setPersistedRouteIds((routesPayload as CorridorRoute[]).map((route) => route.id));
      setPersistedMarkerIds((markersPayload as AdminMarker[]).map((marker) => marker.id));
      setSelectedRouteId((routesPayload as CorridorRoute[])[0]?.id ?? null);
      setSelectedMarkerId((markersPayload as AdminMarker[])[0]?.id ?? null);
      setExpandedSegmentIds(
        ((routesPayload as CorridorRoute[])[0]?.segments ?? []).slice(0, 1).map((segment) => segment.id),
      );
    });
  }, []);

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? null;
  const selectedMarker =
    markers.find((marker) => marker.id === selectedMarkerId) ?? null;

  function resetStatus() {
    setSaveError(null);
    setSaveSuccess(null);
  }

  async function saveRoute(route: CorridorRoute) {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const method = persistedRouteIds.includes(route.id) ? "PATCH" : "POST";
    const url =
      method === "PATCH" ? `/api/admin/routes/${route.id}` : "/api/admin/routes";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(route),
      });
      const payload = (await response.json().catch(() => null)) as
        | CorridorRoute
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("id" in payload)) {
        setSaveError(
          (payload && "error" in payload && payload.error) || "Failed to save route.",
        );
        return;
      }

      const nextRoutes = routes.some((item) => item.id === payload.id)
        ? routes.map((item) => (item.id === payload.id ? payload : item))
        : [...routes, payload];

      setRoutes(nextRoutes);
      setPersistedRouteIds((current) =>
        current.includes(payload.id) ? current : [...current, payload.id],
      );
      setSelectedRouteId(payload.id);
      setSaveSuccess("Route saved.");
    } catch {
      setSaveError("Failed to save route.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMarker(marker: AdminMarker) {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const method = persistedMarkerIds.includes(marker.id) ? "PATCH" : "POST";
    const url =
      method === "PATCH" ? `/api/admin/markers/${marker.id}` : "/api/admin/markers";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marker),
      });
      const payload = (await response.json().catch(() => null)) as
        | AdminMarker
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("id" in payload)) {
        setSaveError(
          (payload && "error" in payload && payload.error) || "Failed to save marker.",
        );
        return;
      }

      const nextMarkers = markers.some((item) => item.id === payload.id)
        ? markers.map((item) => (item.id === payload.id ? payload : item))
        : [...markers, payload];

      setMarkers(nextMarkers);
      setPersistedMarkerIds((current) =>
        current.includes(payload.id) ? current : [...current, payload.id],
      );
      setSelectedMarkerId(payload.id);
      setSaveSuccess("Marker saved.");
    } catch {
      setSaveError("Failed to save marker.");
    } finally {
      setSaving(false);
    }
  }

  function toggleSegmentExpansion(segmentId: string) {
    setExpandedSegmentIds((current) =>
      current.includes(segmentId)
        ? current.filter((id) => id !== segmentId)
        : [...current, segmentId],
    );
  }

  async function removeRoute(id: string) {
    if (!window.confirm("Delete this route?")) {
      return;
    }

    await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
    const nextRoutes = routes.filter((route) => route.id !== id);
    setRoutes(nextRoutes);
    setPersistedRouteIds((current) => current.filter((routeId) => routeId !== id));
    setSelectedRouteId(nextRoutes[0]?.id ?? null);
    setExpandedSegmentIds(nextRoutes[0]?.segments.slice(0, 1).map((segment) => segment.id) ?? []);
  }

  async function removeMarker(id: string) {
    if (!window.confirm("Delete this marker?")) {
      return;
    }

    await fetch(`/api/admin/markers/${id}`, { method: "DELETE" });
    const nextMarkers = markers.filter((marker) => marker.id !== id);
    setMarkers(nextMarkers);
    setPersistedMarkerIds((current) => current.filter((markerId) => markerId !== id));
    setSelectedMarkerId(nextMarkers[0]?.id ?? null);
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function createRoute() {
    const route = createEmptyRoute();
    setRoutes((current) => [...current, route]);
    setSelectedRouteId(route.id);
    setExpandedSegmentIds(route.segments.map((segment) => segment.id));
    resetStatus();
  }

  function createMarker() {
    const marker = createEmptyMarker();
    setMarkers((current) => [...current, marker]);
    setSelectedMarkerId(marker.id);
    resetStatus();
  }

  const isRoutes = activeRegister === "routes";

  return (
    <div className="admin-shell min-h-screen" lang="en">
      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
        {/* Harbor control header — the signature instrument bar */}
        <header className="hc-panel relative overflow-hidden px-5 py-5 md:px-7 md:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(246,181,61,0.16),transparent_70%)]"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="hc-eyebrow flex items-center gap-2">
                <span className="hc-live" aria-hidden="true" />
                Baku Port · Corridor Control
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--hc-text)] md:text-[1.75rem]">
                Operations Console
              </h1>
              <p className="hc-mono mt-3 text-xs text-[var(--hc-muted)]">
                <span className="text-[var(--hc-accent-ink)]">{routes.length}</span> routes
                <span className="px-2 text-[var(--hc-faint)]">·</span>
                <span className="text-[var(--hc-accent-ink)]">{markers.length}</span> markers
                <span className="px-2 text-[var(--hc-faint)]">·</span>
                file store
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <AdminThemeToggle />
              <button type="button" onClick={() => void handleLogout()} className="hc-btn">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Register switch + live save status */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hc-switch" role="tablist" aria-label="Registry">
            <button
              type="button"
              role="tab"
              aria-selected={isRoutes}
              data-active={isRoutes}
              onClick={() => setActiveRegister("routes")}
            >
              <Route className="h-4 w-4" aria-hidden="true" />
              Routes
              <span className="hc-mono text-xs opacity-70">{routes.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isRoutes}
              data-active={!isRoutes}
              onClick={() => setActiveRegister("markers")}
            >
              <MapPinned className="h-4 w-4" aria-hidden="true" />
              Markers
              <span className="hc-mono text-xs opacity-70">{markers.length}</span>
            </button>
          </div>

          <div className="min-h-[1.25rem]" aria-live="polite">
            {saveError ? (
              <p className="hc-mono text-sm text-[var(--hc-rose)]">⚠ {saveError}</p>
            ) : saveSuccess ? (
              <p className="hc-mono text-sm text-[var(--hc-cyan)]">✓ {saveSuccess}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* Registry rail */}
          <aside className="hc-panel h-fit p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="hc-label">{isRoutes ? "Route registry" : "Marker registry"}</p>
              <button
                type="button"
                onClick={() => (isRoutes ? createRoute() : createMarker())}
                className="hc-btn hc-btn--xs hc-btn--primary"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New
              </button>
            </div>

            <div className="space-y-2">
              {isRoutes
                ? routes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      data-active={selectedRouteId === route.id}
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        setExpandedSegmentIds(
                          route.segments.slice(0, 1).map((segment) => segment.id),
                        );
                        resetStatus();
                      }}
                      className="hc-rail-item"
                    >
                      <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                        {route.name?.en || route.id}
                      </p>
                      <p className="hc-mono mt-1 text-xs uppercase tracking-wider text-[var(--hc-muted)]">
                        {route.status} · {route.segments.length} legs
                      </p>
                    </button>
                  ))
                : markers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      data-active={selectedMarkerId === marker.id}
                      onClick={() => {
                        setSelectedMarkerId(marker.id);
                        resetStatus();
                      }}
                      className="hc-rail-item"
                    >
                      <p className="truncate text-sm font-semibold text-[var(--hc-text)]">
                        {marker.name?.en || marker.id}
                      </p>
                      <p className="hc-mono mt-1 text-xs uppercase tracking-wider text-[var(--hc-muted)]">
                        {marker.category}
                      </p>
                    </button>
                  ))}

              {(isRoutes ? routes.length : markers.length) === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--hc-line-strong)] px-3 py-6 text-center text-sm text-[var(--hc-muted)]">
                  Nothing here yet. Select <span className="text-[var(--hc-text)]">New</span> to
                  create the first {isRoutes ? "route" : "marker"}.
                </p>
              ) : null}
            </div>
          </aside>

          {/* Editor */}
          <div>
            {isRoutes ? (
              selectedRoute ? (
                <section className="hc-panel p-5 md:p-6">
                  <div className="flex flex-col gap-4 border-b border-[var(--hc-line)] pb-5 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="hc-eyebrow">Route editor</p>
                      <h2 className="mt-1 truncate text-xl font-semibold text-[var(--hc-text)]">
                        {selectedRoute.name?.en || selectedRoute.id}
                      </h2>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void saveRoute(selectedRoute)}
                        disabled={saving}
                        className="hc-btn hc-btn--primary"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {saving ? "Saving…" : "Save route"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeRoute(selectedRoute.id)}
                        className="hc-btn hc-btn--danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="hc-label mb-2">Route ID</span>
                        <input
                          value={selectedRoute.id}
                          onChange={(event) =>
                            setRoutes((current) =>
                              current.map((route) =>
                                route.id === selectedRoute.id
                                  ? { ...route, id: event.target.value }
                                  : route,
                              ),
                            )
                          }
                          className="hc-field hc-mono"
                        />
                      </label>
                      <label className="block">
                        <span className="hc-label mb-2">Type</span>
                        <select
                          value={selectedRoute.type}
                          onChange={(event) =>
                            setRoutes((current) =>
                              current.map((route) =>
                                route.id === selectedRoute.id
                                  ? {
                                      ...route,
                                      type: event.target.value as CorridorRoute["type"],
                                    }
                                  : route,
                              ),
                            )
                          }
                          className="hc-field"
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="hc-label mb-2">Status</span>
                        <select
                          value={selectedRoute.status}
                          onChange={(event) =>
                            setRoutes((current) =>
                              current.map((route) =>
                                route.id === selectedRoute.id
                                  ? {
                                      ...route,
                                      status: event.target.value as CorridorRoute["status"],
                                    }
                                  : route,
                              ),
                            )
                          }
                          className="hc-field"
                        >
                          <option value="active">Active</option>
                          <option value="planned">Planned</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </label>
                    </div>

                    <LocalizedInputs
                      label="Name"
                      value={selectedRoute.name}
                      onChange={(value) =>
                        setRoutes((current) =>
                          current.map((route) =>
                            route.id === selectedRoute.id ? { ...route, name: value } : route,
                          ),
                        )
                      }
                    />

                    <LocalizedInputs
                      label="Transit time"
                      value={selectedRoute.transitTime}
                      onChange={(value) =>
                        setRoutes((current) =>
                          current.map((route) =>
                            route.id === selectedRoute.id
                              ? { ...route, transitTime: value }
                              : route,
                          ),
                        )
                      }
                    />

                    <LocalizedInputs
                      label="Description"
                      value={selectedRoute.description}
                      multiline
                      onChange={(value) =>
                        setRoutes((current) =>
                          current.map((route) =>
                            route.id === selectedRoute.id
                              ? { ...route, description: value }
                              : route,
                          ),
                        )
                      }
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="hc-label mb-2">Total distance (km)</span>
                        <input
                          type="number"
                          value={selectedRoute.totalDistanceKm}
                          onChange={(event) =>
                            setRoutes((current) =>
                              current.map((route) =>
                                route.id === selectedRoute.id
                                  ? {
                                      ...route,
                                      totalDistanceKm: Number(event.target.value),
                                    }
                                  : route,
                              ),
                            )
                          }
                          className="hc-field hc-mono"
                        />
                      </label>
                      <label className="block">
                        <span className="hc-label mb-2">Animation speed</span>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedRoute.animationSpeed}
                          onChange={(event) =>
                            setRoutes((current) =>
                              current.map((route) =>
                                route.id === selectedRoute.id
                                  ? {
                                      ...route,
                                      animationSpeed: Number(event.target.value),
                                    }
                                  : route,
                              ),
                            )
                          }
                          className="hc-field hc-mono"
                        />
                      </label>
                    </div>

                    <CountrySelector
                      value={selectedRoute.countries}
                      onChange={(value) =>
                        setRoutes((current) =>
                          current.map((route) =>
                            route.id === selectedRoute.id
                              ? { ...route, countries: value }
                              : route,
                          ),
                        )
                      }
                    />

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="hc-label">Leg manifest</p>
                        <button
                          type="button"
                          onClick={() => {
                            const newSegment = createEmptySegment();
                            setExpandedSegmentIds((current) => [...current, newSegment.id]);
                            setRoutes((current) =>
                              current.map((route) =>
                                route.id === selectedRoute.id
                                  ? {
                                      ...route,
                                      segments: [...route.segments, newSegment],
                                    }
                                  : route,
                              ),
                            );
                          }}
                          className="hc-btn hc-btn--xs"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          Add leg
                        </button>
                      </div>

                      <div className="space-y-3">
                        {selectedRoute.segments.map((segment, segmentIndex) => {
                          const isExpanded = expandedSegmentIds.includes(segment.id);

                          return (
                            <div key={segment.id} className="hc-inset overflow-hidden">
                              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => toggleSegmentExpansion(segment.id)}
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <span className="hc-index">{segmentIndex + 1}</span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[var(--hc-text)]">
                                      {segment.from.en && segment.to.en
                                        ? `${segment.from.en} → ${segment.to.en}`
                                        : segment.id}
                                    </span>
                                    <span className="hc-mono mt-0.5 block text-xs uppercase tracking-wider text-[var(--hc-muted)]">
                                      {segment.mode} · {segment.distanceKm} km ·{" "}
                                      {segment.stopIds?.length ?? 0} stops
                                    </span>
                                  </span>
                                </button>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSegmentExpansion(segment.id)}
                                    className="hc-btn hc-btn--xs"
                                  >
                                    <ChevronDown
                                      className={`h-3.5 w-3.5 transition ${
                                        isExpanded ? "rotate-180" : ""
                                      }`}
                                      aria-hidden="true"
                                    />
                                    {isExpanded ? "Collapse" : "Expand"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm("Delete this segment?")) {
                                        return;
                                      }

                                      setExpandedSegmentIds((current) =>
                                        current.filter((id) => id !== segment.id),
                                      );
                                      setRoutes((current) =>
                                        current.map((route) =>
                                          route.id === selectedRoute.id
                                            ? {
                                                ...route,
                                                segments: route.segments.filter(
                                                  (item) => item.id !== segment.id,
                                                ),
                                              }
                                            : route,
                                        ),
                                      );
                                    }}
                                    className="hc-btn hc-btn--xs hc-btn--danger"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              {isExpanded ? (
                                <div className="space-y-4 border-t border-[var(--hc-line)] px-4 py-4">
                                  <div className="grid gap-4 md:grid-cols-3">
                                    <label className="block">
                                      <span className="hc-label mb-2">Mode</span>
                                      <select
                                        value={segment.mode}
                                        onChange={(event) =>
                                          setRoutes((current) =>
                                            current.map((route) =>
                                              route.id === selectedRoute.id
                                                ? {
                                                    ...route,
                                                    segments: route.segments.map((item) =>
                                                      item.id === segment.id
                                                        ? {
                                                            ...item,
                                                            mode: event.target
                                                              .value as CorridorSegment["mode"],
                                                          }
                                                        : item,
                                                    ),
                                                  }
                                                : route,
                                            ),
                                          )
                                        }
                                        className="hc-field"
                                      >
                                        <option value="rail">Rail</option>
                                        <option value="ship">Ship</option>
                                        <option value="road">Road</option>
                                      </select>
                                    </label>
                                    <label className="block">
                                      <span className="hc-label mb-2">Distance (km)</span>
                                      <input
                                        type="number"
                                        value={segment.distanceKm}
                                        onChange={(event) =>
                                          setRoutes((current) =>
                                            current.map((route) =>
                                              route.id === selectedRoute.id
                                                ? {
                                                    ...route,
                                                    segments: route.segments.map((item) =>
                                                      item.id === segment.id
                                                        ? {
                                                            ...item,
                                                            distanceKm: Number(
                                                              event.target.value,
                                                            ),
                                                          }
                                                        : item,
                                                    ),
                                                  }
                                                : route,
                                            ),
                                          )
                                        }
                                        className="hc-field hc-mono"
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="hc-label mb-2">Segment ID</span>
                                      <input
                                        value={segment.id}
                                        onChange={(event) =>
                                          setRoutes((current) =>
                                            current.map((route) =>
                                              route.id === selectedRoute.id
                                                ? {
                                                    ...route,
                                                    segments: route.segments.map((item) =>
                                                      item.id === segment.id
                                                        ? { ...item, id: event.target.value }
                                                        : item,
                                                    ),
                                                  }
                                                : route,
                                            ),
                                          )
                                        }
                                        className="hc-field hc-mono"
                                      />
                                    </label>
                                  </div>

                                  <StopPathEditor
                                    segment={segment}
                                    onChange={(nextSegment) =>
                                      setRoutes((current) =>
                                        current.map((route) =>
                                          route.id === selectedRoute.id
                                            ? {
                                                ...route,
                                                segments: route.segments.map((item) =>
                                                  item.id === segment.id ? nextSegment : item,
                                                ),
                                              }
                                            : route,
                                        ),
                                      )
                                    }
                                  />
                                  <SegmentLineEditor
                                    segment={segment}
                                    onChange={(nextSegment) =>
                                      setRoutes((current) =>
                                        current.map((route) =>
                                          route.id === selectedRoute.id
                                            ? {
                                                ...route,
                                                segments: route.segments.map((item) =>
                                                  item.id === segment.id ? nextSegment : item,
                                                ),
                                              }
                                            : route,
                                        ),
                                      )
                                    }
                                  />
                                  <LocalizedInputs
                                    label="From"
                                    value={segment.from}
                                    onChange={(value) =>
                                      setRoutes((current) =>
                                        current.map((route) =>
                                          route.id === selectedRoute.id
                                            ? {
                                                ...route,
                                                segments: route.segments.map((item) =>
                                                  item.id === segment.id
                                                    ? { ...item, from: value }
                                                    : item,
                                                ),
                                              }
                                            : route,
                                        ),
                                      )
                                    }
                                  />
                                  <LocalizedInputs
                                    label="To"
                                    value={segment.to}
                                    onChange={(value) =>
                                      setRoutes((current) =>
                                        current.map((route) =>
                                          route.id === selectedRoute.id
                                            ? {
                                                ...route,
                                                segments: route.segments.map((item) =>
                                                  item.id === segment.id
                                                    ? { ...item, to: value }
                                                    : item,
                                                ),
                                              }
                                            : route,
                                        ),
                                      )
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <EmptyEditor kind="route" />
              )
            ) : selectedMarker ? (
              <section className="hc-panel p-5 md:p-6">
                <div className="flex flex-col gap-4 border-b border-[var(--hc-line)] pb-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="hc-eyebrow">Marker editor</p>
                    <h2 className="mt-1 truncate text-xl font-semibold text-[var(--hc-text)]">
                      {selectedMarker.name?.en || selectedMarker.id}
                    </h2>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void saveMarker(selectedMarker)}
                      disabled={saving}
                      className="hc-btn hc-btn--primary"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      {saving ? "Saving…" : "Save marker"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeMarker(selectedMarker.id)}
                      className="hc-btn hc-btn--danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="hc-label mb-2">Marker ID</span>
                      <input
                        value={selectedMarker.id}
                        onChange={(event) =>
                          setMarkers((current) =>
                            current.map((marker) =>
                              marker.id === selectedMarker.id
                                ? { ...marker, id: event.target.value }
                                : marker,
                            ),
                          )
                        }
                        className="hc-field hc-mono"
                      />
                    </label>
                    <label className="block">
                      <span className="hc-label mb-2">Category</span>
                      <select
                        value={selectedMarker.category}
                        onChange={(event) =>
                          setMarkers((current) =>
                            current.map((marker) =>
                              marker.id === selectedMarker.id
                                ? {
                                    ...marker,
                                    category: event.target.value as AdminMarker["category"],
                                    icon:
                                      isDefaultMarkerIconForCategory(
                                        marker.icon,
                                        marker.category,
                                      )
                                        ? DEFAULT_MARKER_ICON_BY_CATEGORY[
                                            event.target.value as AdminMarker["category"]
                                          ]
                                        : marker.icon,
                                  }
                                : marker,
                            ),
                          )
                        }
                        className="hc-field"
                      >
                        <option value="port">Port</option>
                        <option value="station">Station</option>
                        <option value="border">Border</option>
                        <option value="city">City</option>
                      </select>
                    </label>
                  </div>

                  <MarkerIconSelector
                    value={selectedMarker.icon}
                    category={selectedMarker.category}
                    onChange={(value) =>
                      setMarkers((current) =>
                        current.map((marker) =>
                          marker.id === selectedMarker.id ? { ...marker, icon: value } : marker,
                        ),
                      )
                    }
                  />

                  <ConnectedCorridorsSelector
                    routes={routes}
                    value={selectedMarker.connectedCorridorIds}
                    onChange={(value) =>
                      setMarkers((current) =>
                        current.map((marker) =>
                          marker.id === selectedMarker.id
                            ? { ...marker, connectedCorridorIds: value }
                            : marker,
                        ),
                      )
                    }
                  />

                  <LocalizedInputs
                    label="Marker name"
                    value={selectedMarker.name}
                    onChange={(value) =>
                      setMarkers((current) =>
                        current.map((marker) =>
                          marker.id === selectedMarker.id ? { ...marker, name: value } : marker,
                        ),
                      )
                    }
                  />

                  <LocalizedInputs
                    label="Description"
                    value={selectedMarker.description}
                    multiline
                    onChange={(value) =>
                      setMarkers((current) =>
                        current.map((marker) =>
                          marker.id === selectedMarker.id
                            ? { ...marker, description: value }
                            : marker,
                        ),
                      )
                    }
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="hc-label mb-2">Latitude</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={selectedMarker.coordinates[0]}
                        onChange={(event) =>
                          setMarkers((current) =>
                            current.map((marker) =>
                              marker.id === selectedMarker.id
                                ? {
                                    ...marker,
                                    coordinates: [
                                      Number(event.target.value),
                                      marker.coordinates[1],
                                    ],
                                  }
                                : marker,
                            ),
                          )
                        }
                        className="hc-field hc-mono"
                      />
                    </label>
                    <label className="block">
                      <span className="hc-label mb-2">Longitude</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={selectedMarker.coordinates[1]}
                        onChange={(event) =>
                          setMarkers((current) =>
                            current.map((marker) =>
                              marker.id === selectedMarker.id
                                ? {
                                    ...marker,
                                    coordinates: [
                                      marker.coordinates[0],
                                      Number(event.target.value),
                                    ],
                                  }
                                : marker,
                            ),
                          )
                        }
                        className="hc-field hc-mono"
                      />
                    </label>
                  </div>
                </div>
              </section>
            ) : (
              <EmptyEditor kind="marker" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyEditor({ kind }: { kind: "route" | "marker" }) {
  return (
    <div className="hc-panel grid place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        {kind === "route" ? (
          <Route className="mx-auto h-7 w-7 text-[var(--hc-faint)]" aria-hidden="true" />
        ) : (
          <MapPinned className="mx-auto h-7 w-7 text-[var(--hc-faint)]" aria-hidden="true" />
        )}
        <p className="mt-3 text-sm font-semibold text-[var(--hc-text)]">
          No {kind} selected
        </p>
        <p className="mt-1 text-sm text-[var(--hc-muted)]">
          Pick a {kind} from the registry on the left, or create a new one to start editing.
        </p>
      </div>
    </div>
  );
}
