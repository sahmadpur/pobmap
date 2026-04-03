"use client";

import { useEffect, useState } from "react";
import { LogOut, MapPinned, Plus, Route, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import type { AdminMarker } from "@/types/admin";
import type { CorridorRoute, CorridorSegment, LocalizedText } from "@/types/map";

function emptyLocalizedText(): LocalizedText {
  return { az: "", en: "", ru: "" };
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
    segments: [
      {
        id: `segment-${crypto.randomUUID()}`,
        mode: "rail",
        from: emptyLocalizedText(),
        to: emptyLocalizedText(),
        distanceKm: 0,
        coordinates: [
          [40.3572, 49.835],
          [41.0, 49.0],
        ],
      },
    ],
  };
}

function createEmptyMarker(): AdminMarker {
  return {
    id: `marker-${crypto.randomUUID()}`,
    name: emptyLocalizedText(),
    description: emptyLocalizedText(),
    category: "port",
    icon: "anchor",
    coordinates: [40.3572, 49.835],
    connectedCorridorIds: [],
  };
}

function CoordinatesField({
  value,
  onChange,
}: {
  value: CorridorSegment["coordinates"];
  onChange: (coordinates: CorridorSegment["coordinates"]) => void;
}) {
  return (
    <textarea
      value={JSON.stringify(value, null, 2)}
      onChange={(event) => {
        try {
          onChange(JSON.parse(event.target.value) as CorridorSegment["coordinates"]);
        } catch {
          // Keep textarea editable while the JSON is temporarily invalid.
        }
      }}
      rows={5}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
    />
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

export function AdminConsole() {
  const router = useRouter();
  const [routes, setRoutes] = useState<CorridorRoute[]>([]);
  const [markers, setMarkers] = useState<AdminMarker[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/routes").then((response) => response.json()),
      fetch("/api/admin/markers").then((response) => response.json()),
    ]).then(([routesPayload, markersPayload]) => {
      setRoutes(routesPayload as CorridorRoute[]);
      setMarkers(markersPayload as AdminMarker[]);
      setSelectedRouteId((routesPayload as CorridorRoute[])[0]?.id ?? null);
      setSelectedMarkerId((markersPayload as AdminMarker[])[0]?.id ?? null);
    });
  }, []);

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? null;
  const selectedMarker =
    markers.find((marker) => marker.id === selectedMarkerId) ?? null;

  async function saveRoute(route: CorridorRoute) {
    setSaving(true);

    const method = routes.some((item) => item.id === route.id) ? "PATCH" : "POST";
    const url =
      method === "PATCH" ? `/api/admin/routes/${route.id}` : "/api/admin/routes";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(route),
    });
    const payload = (await response.json()) as CorridorRoute;
    const nextRoutes = routes.some((item) => item.id === payload.id)
      ? routes.map((item) => (item.id === payload.id ? payload : item))
      : [...routes, payload];

    setRoutes(nextRoutes);
    setSelectedRouteId(payload.id);
    setSaving(false);
  }

  async function saveMarker(marker: AdminMarker) {
    setSaving(true);

    const method = markers.some((item) => item.id === marker.id) ? "PATCH" : "POST";
    const url =
      method === "PATCH" ? `/api/admin/markers/${marker.id}` : "/api/admin/markers";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(marker),
    });
    const payload = (await response.json()) as AdminMarker;
    const nextMarkers = markers.some((item) => item.id === payload.id)
      ? markers.map((item) => (item.id === payload.id ? payload : item))
      : [...markers, payload];

    setMarkers(nextMarkers);
    setSelectedMarkerId(payload.id);
    setSaving(false);
  }

  async function removeRoute(id: string) {
    await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
    const nextRoutes = routes.filter((route) => route.id !== id);
    setRoutes(nextRoutes);
    setSelectedRouteId(nextRoutes[0]?.id ?? null);
  }

  async function removeMarker(id: string) {
    await fetch(`/api/admin/markers/${id}`, { method: "DELETE" });
    const nextMarkers = markers.filter((marker) => marker.id !== id);
    setMarkers(nextMarkers);
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
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-slate-900">Routes</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const route = createEmptyRoute();
                    setRoutes((current) => [...current, route]);
                    setSelectedRouteId(route.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  New
                </button>
              </div>

              <div className="space-y-2">
                {routes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedRouteId === route.id
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {route.name.en || route.id}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {route.status}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-slate-900">Markers</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const marker = createEmptyMarker();
                    setMarkers((current) => [...current, marker]);
                    setSelectedMarkerId(marker.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  New
                </button>
              </div>

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
                      {marker.name.en || marker.id}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {marker.category}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            {selectedRoute ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Route Editor
                    </h2>
                    <p className="text-sm text-slate-500">
                      Manage multilingual route content and transport segments.
                    </p>
                  </div>
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

                <div className="space-y-5">
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

                  <div className="grid gap-4 md:grid-cols-3">
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
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Countries (comma separated)
                      </span>
                      <input
                        value={selectedRoute.countries.join(", ")}
                        onChange={(event) =>
                          setRoutes((current) =>
                            current.map((route) =>
                              route.id === selectedRoute.id
                                ? {
                                    ...route,
                                    countries: event.target.value
                                      .split(",")
                                      .map((value) => value.trim().toUpperCase())
                                      .filter(Boolean),
                                  }
                                : route,
                            ),
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                      />
                    </label>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                        Segments
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setRoutes((current) =>
                            current.map((route) =>
                              route.id === selectedRoute.id
                                ? {
                                    ...route,
                                    segments: [
                                      ...route.segments,
                                      {
                                        id: `segment-${crypto.randomUUID()}`,
                                        mode: "rail",
                                        from: emptyLocalizedText(),
                                        to: emptyLocalizedText(),
                                        distanceKm: 0,
                                        coordinates: [
                                          [40.3572, 49.835],
                                          [41.0, 49.0],
                                        ],
                                      },
                                    ],
                                  }
                                : route,
                            ),
                          )
                        }
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
                          className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">
                              {segment.id}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
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
                                )
                              }
                              className="text-sm font-medium text-rose-700"
                            >
                              Remove
                            </button>
                          </div>

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

                          <div className="mt-4 space-y-4">
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
                            <div>
                              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                Coordinates JSON
                              </span>
                              <CoordinatesField
                                value={segment.coordinates}
                                onChange={(coordinates) =>
                                  setRoutes((current) =>
                                    current.map((route) =>
                                      route.id === selectedRoute.id
                                        ? {
                                            ...route,
                                            segments: route.segments.map((item) =>
                                              item.id === segment.id
                                                ? { ...item, coordinates }
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {selectedMarker ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Marker Editor
                    </h2>
                    <p className="text-sm text-slate-500">
                      Manage map pins, categories, and popup content.
                    </p>
                  </div>
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

                <div className="space-y-5">
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
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Icon
                      </span>
                      <input
                        value={selectedMarker.icon}
                        onChange={(event) =>
                          setMarkers((current) =>
                            current.map((marker) =>
                              marker.id === selectedMarker.id
                                ? { ...marker, icon: event.target.value }
                                : marker,
                            ),
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        Connected corridor IDs
                      </span>
                      <input
                        value={selectedMarker.connectedCorridorIds.join(", ")}
                        onChange={(event) =>
                          setMarkers((current) =>
                            current.map((marker) =>
                              marker.id === selectedMarker.id
                                ? {
                                    ...marker,
                                    connectedCorridorIds: event.target.value
                                      .split(",")
                                      .map((value) => value.trim())
                                      .filter(Boolean),
                                  }
                                : marker,
                            ),
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                      />
                    </label>
                  </div>

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
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
