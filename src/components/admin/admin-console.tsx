"use client";

import { useEffect, useState } from "react";
import { ChevronDown, LogOut, MapPinned, Plus, Route, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Stops and Waypoints
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Search cities from the built-in catalog and the map path updates automatically.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {segment.coordinates.length} map points
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">
          Coordinates are generated from the stop order below.
        </p>
        <button
          type="button"
          onClick={applyStopLabels}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
        >
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
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {getTransportStopLabel(stop, "en")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getTransportStopCountryLabel(stop, "en")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Add stop
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city or country"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
          />
        </label>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {results.map((stop) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => {
                updateStopIds([...stopIds, stop.id]);
                setQuery("");
              }}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {getTransportStopLabel(stop, "en")}
                </p>
                <p className="text-xs text-slate-500">
                  {getTransportStopCountryLabel(stop, "en")}
                </p>
              </div>
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white">
                Add
              </span>
            </button>
          ))}
        </div>
      </div>
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
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Countries
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Search and add corridor countries with flags.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {value.length} selected
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {value.map((countryCode) => {
          const country = COUNTRY_NAMES[countryCode];

          return (
            <button
              key={countryCode}
              type="button"
              onClick={() => onChange(value.filter((code) => code !== countryCode))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
            >
              <span aria-hidden="true">{getCountryFlagEmoji(countryCode)}</span>
              <span>{country?.en ?? countryCode}</span>
              <span className="text-slate-400">×</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Add country
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search country or code"
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
        />
      </label>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {results.map((country) => (
          <button
            key={country.code}
            type="button"
            onClick={() => {
              if (selectedCodes.has(country.code)) {
                return;
              }

              onChange([...value, country.code]);
              setQuery("");
            }}
            disabled={selectedCodes.has(country.code)}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {getCountryFlagEmoji(country.code)} {country.name.en}
              </p>
              <p className="text-xs text-slate-500">{country.code}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                selectedCodes.has(country.code)
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-950 text-white"
              }`}
            >
              {selectedCodes.has(country.code) ? "Selected" : "Add"}
            </span>
          </button>
        ))}
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
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            {label} {language.toUpperCase()}
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
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
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
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Icon
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Pick the marker icon visually.
          </p>
        </div>
        <div
          className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-slate-950 text-white shadow-sm [&_svg]:h-6 [&_svg]:w-6"
          dangerouslySetInnerHTML={{
            __html: getMarkerIconSvg(value, category),
          }}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Search icons
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Font Awesome Free icons"
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
        />
      </label>

      <p className="mt-3 text-xs text-slate-500">
        {normalizedQuery
          ? `Showing ${results.length} matching Font Awesome Free icons for "${query}".`
          : "Showing featured icons. Search to browse the full Font Awesome Free catalog."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((option) => {
          const isSelected = option.id === value;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                isSelected
                  ? "border-sky-300 bg-sky-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full [&_svg]:h-5 [&_svg]:w-5 ${
                    isSelected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                  dangerouslySetInnerHTML={{ __html: option.svg }}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-500">{option.style} · {option.id}</p>
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
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Connected corridors
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Select from the current route catalog.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {value.length} selected
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {value.map((routeId) => {
          const route = routes.find((item) => item.id === routeId);
          const label = route?.name.en || routeId;

          return (
            <button
              key={routeId}
              type="button"
              onClick={() => onChange(value.filter((id) => id !== routeId))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
            >
              <span>{label}</span>
              <span className="text-slate-400">×</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Add corridor
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search route name or ID"
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
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
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {route.name.en || route.id}
                </p>
                <p className="text-xs text-slate-500">{route.id}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isSelected ? "bg-emerald-100 text-emerald-700" : "bg-slate-950 text-white"
                }`}
              >
                {isSelected ? "Selected" : "Add"}
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
  const [isRoutesPanelOpen, setIsRoutesPanelOpen] = useState(false);
  const [isMarkersPanelOpen, setIsMarkersPanelOpen] = useState(false);
  const [isRouteEditorOpen, setIsRouteEditorOpen] = useState(false);
  const [isMarkerEditorOpen, setIsMarkerEditorOpen] = useState(false);

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
      setSaveSuccess("Route saved successfully.");
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
      setSaveSuccess("Marker saved successfully.");
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

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
              Admin CMS
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Route and Marker Management
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsRoutesPanelOpen((current) => !current)}
                  className="inline-flex items-center gap-2 text-left"
                >
                  <Route className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-slate-900">Routes</h2>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition ${
                      isRoutesPanelOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const route = createEmptyRoute();
                    setRoutes((current) => [...current, route]);
                    setSelectedRouteId(route.id);
                    setExpandedSegmentIds([]);
                    setIsRoutesPanelOpen(true);
                    setSaveError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  New
                </button>
              </div>

              {isRoutesPanelOpen ? (
                <div className="space-y-2">
                  {routes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        setExpandedSegmentIds(route.segments.slice(0, 1).map((segment) => segment.id));
                      }}
                      className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedRouteId === route.id
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {route.name?.en || route.id}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {route.status}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {routes.length} routes hidden. Expand to browse and select.
                </p>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsMarkersPanelOpen((current) => !current)}
                  className="inline-flex items-center gap-2 text-left"
                >
                  <MapPinned className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-slate-900">Markers</h2>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition ${
                      isMarkersPanelOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const marker = createEmptyMarker();
                    setMarkers((current) => [...current, marker]);
                    setSelectedMarkerId(marker.id);
                    setIsMarkersPanelOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  New
                </button>
              </div>

              {isMarkersPanelOpen ? (
                <div className="space-y-2">
                  {markers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={() => setSelectedMarkerId(marker.id)}
                      className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedMarkerId === marker.id
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {marker.name?.en || marker.id}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {marker.category}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {markers.length} markers hidden. Expand to browse and select.
                </p>
              )}
            </section>
          </aside>

          <div className="space-y-6">
            {saveError ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {saveError}
              </div>
            ) : null}

            {saveSuccess ? (
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveSuccess}
              </div>
            ) : null}

            {selectedRoute ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsRouteEditorOpen((current) => !current)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Route Editor
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedRoute.name?.en || selectedRoute.id}
                    </p>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition ${
                      isRouteEditorOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isRouteEditorOpen ? (
                <div className="mt-5 space-y-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">
                      Manage multilingual route content and transport segments.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveRoute(selectedRoute)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Save route
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeRoute(selectedRoute.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Route ID
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Type
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      >
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Status
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
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
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Total distance (km)
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Animation speed
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
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
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Segments
                      </h3>
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
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Add segment
                      </button>
                    </div>

                    <div className="space-y-4">
                      {selectedRoute.segments.map((segment) => (
                        <div
                          key={segment.id}
                          className="rounded-[1.5rem] border border-slate-200 bg-slate-50"
                        >
                          <div className="flex items-center justify-between gap-3 px-4 py-4">
                            <button
                              type="button"
                              onClick={() => toggleSegmentExpansion(segment.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {segment.from.en && segment.to.en
                                  ? `${segment.from.en} → ${segment.to.en}`
                                  : segment.id}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                {segment.mode} · {segment.distanceKm} km · {segment.stopIds?.length ?? 0} stops
                              </p>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleSegmentExpansion(segment.id)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                              >
                                {expandedSegmentIds.includes(segment.id) ? "Collapse" : "Expand"}
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
                                className="text-sm font-medium text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {expandedSegmentIds.includes(segment.id) ? (
                            <div className="space-y-4 border-t border-slate-200 px-4 py-4">
                              <div className="grid gap-4 md:grid-cols-3">
                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                    Mode
                                  </span>
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
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                                  >
                                    <option value="rail">Rail</option>
                                    <option value="ship">Ship</option>
                                    <option value="road">Road</option>
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                    Distance (km)
                                  </span>
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
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                    Segment ID
                                  </span>
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
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                                  />
                                </label>
                              </div>

                              <div className="space-y-4">
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
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                ) : null}
              </section>
            ) : null}

            {selectedMarker ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsMarkerEditorOpen((current) => !current)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Marker Editor
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedMarker.name?.en || selectedMarker.id}
                    </p>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition ${
                      isMarkerEditorOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isMarkerEditorOpen ? (
                <div className="mt-5 space-y-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">
                      Manage map pins, categories, and popup content.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveMarker(selectedMarker)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Save marker
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeMarker(selectedMarker.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Marker ID
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Category
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      >
                        <option value="port">Port</option>
                        <option value="station">Station</option>
                        <option value="border">Border</option>
                        <option value="city">City</option>
                      </select>
                    </label>
                    <div className="md:col-span-2" />
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
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Latitude
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Longitude
                      </span>
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                      />
                    </label>
                  </div>
                </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
