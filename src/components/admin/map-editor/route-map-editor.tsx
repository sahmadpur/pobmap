"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUp,
  Crosshair,
  Eye,
  EyeOff,
  MapPin,
  MapPinned,
  MousePointer2,
  PenLine,
  Plus,
  Redo2,
  Ruler,
  Save,
  ShipWheel,
  TrainFront,
  Trash2,
  Truck,
  Undo2,
} from "lucide-react";
import dynamic from "next/dynamic";

import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { CityDialog, type CityDraft } from "@/components/admin/map-editor/city-dialog";
import { MarkerDialog, type MarkerDraft } from "@/components/admin/map-editor/marker-dialog";
import type { EditorTool, FitRequest } from "@/components/admin/map-editor/editor-map";
import { basemapTileUrl, type Basemap } from "@/data/basemaps";
import { getCountryFlagEmoji, TRANSPORT_MODE_META } from "@/data/corridors";
import {
  getAllTransportStops,
  getStopForMarker,
  getTransportStop,
  registerTransportStops,
  type TransportStop,
} from "@/data/transport-stops";
import { findCountryIsoAtPoint } from "@/lib/geo-country";
import { flattenRouteCoordinates } from "@/lib/map-utils";
import {
  createHistory,
  pathLengthKm,
  pushHistory,
  redoHistory,
  relocateStopInRoutes,
  reverseVertices,
  segmentToVertices,
  slugifyStopId,
  undoHistory,
  validateVertices,
  verticesToSegment,
  verticesToStopIds,
  type EditorVertex,
  type History,
} from "@/lib/route-editor-model";
import type { AdminMarker, AdminStop } from "@/types/admin";
import type {
  Coordinate,
  CorridorRoute,
  CorridorSegment,
  SegmentLineStyle,
  TransportMode,
} from "@/types/map";

const EditorMap = dynamic(
  () => import("@/components/admin/map-editor/editor-map").then((mod) => mod.EditorMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center text-sm text-[var(--hc-muted)]">
        Loading map…
      </div>
    ),
  },
);

interface RawCity {
  n: string;
  ru: string;
  c: [number, number];
}

type Status = { kind: "error" | "success"; text: string } | null;

const NEW_ROUTE_COLORS = ["#0284C7", "#077000", "#4F46E5", "#A855F7", "#F97316", "#E11D48"];

/** How far, in degrees, a Natural Earth city may be from a click to name it. */
const CITY_SUGGESTION_TOLERANCE = 0.35;

function ModeGlyph({ mode }: { mode: TransportMode }) {
  if (mode === "rail") {
    return <TrainFront className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  if (mode === "ship") {
    return <ShipWheel className="h-3.5 w-3.5" aria-hidden="true" />;
  }

  return <Truck className="h-3.5 w-3.5" aria-hidden="true" />;
}

function segmentLabel(segment: CorridorSegment): string {
  if (segment.from.en && segment.to.en) {
    return `${segment.from.en} → ${segment.to.en}`;
  }

  return segment.id;
}

function uniqueSegmentId(route: CorridorRoute, stopIds: string[]): string {
  const base = `${route.id}-${stopIds[0]}-${stopIds[stopIds.length - 1]}`;
  const taken = new Set(route.segments.map((segment) => segment.id));

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;

  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

/** Countries in order of first appearance along the legs, for a route with none tagged. */
function countriesFromSegments(route: CorridorRoute): string[] {
  const codes: string[] = [];

  route.segments.forEach((segment) => {
    (segment.stopIds ?? []).forEach((stopId) => {
      const code = getTransportStop(stopId)?.countryCode;

      if (code && code.length === 2 && !codes.includes(code)) {
        codes.push(code);
      }
    });
  });

  return codes;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  return Boolean(
    element &&
      (element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT" ||
        element.isContentEditable),
  );
}

export function RouteMapEditor() {
  const [routes, setRoutes] = useState<CorridorRoute[]>([]);
  const [customStops, setCustomStops] = useState<AdminStop[]>([]);
  const [markers, setMarkers] = useState<AdminMarker[]>([]);
  /** What the Place tool drops on a click. */
  const [placeKind, setPlaceKind] = useState<"city" | "marker">("city");
  const [markerDraft, setMarkerDraft] = useState<MarkerDraft | null>(null);
  const [markerError, setMarkerError] = useState<string | null>(null);
  const [markerSaving, setMarkerSaving] = useState(false);
  const [persistedRouteIds, setPersistedRouteIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  // The selected corridor's edits, with undo/redo; `savedRoute` is the last
  // persisted version so the dirty state is a plain comparison.
  const [history, setHistory] = useState<History<CorridorRoute> | null>(null);
  const [savedRoute, setSavedRoute] = useState<CorridorRoute | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [activeVertexIndex, setActiveVertexIndex] = useState<number | null>(null);
  const [tool, setTool] = useState<EditorTool>("select");
  const [draft, setDraft] = useState<EditorVertex[]>([]);
  const [draftMode, setDraftMode] = useState<TransportMode>("rail");
  const [chainLegs, setChainLegs] = useState(true);
  const [showOtherRoutes, setShowOtherRoutes] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [basemap, setBasemap] = useState<Basemap | "dark">("default");
  const [fitRequest, setFitRequest] = useState<FitRequest | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [cityDraft, setCityDraft] = useState<CityDraft | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [citySaving, setCitySaving] = useState(false);
  // A free vertex waiting to be turned into a city; anchored once it is saved.
  const [cityForVertex, setCityForVertex] = useState<{
    segmentId: string;
    index: number;
  } | null>(null);
  const countriesRef = useRef<FeatureCollection | null>(null);
  const citiesRef = useRef<RawCity[]>([]);
  const fitCounter = useRef(0);

  const route = history?.present ?? null;
  const isDirty = Boolean(route && JSON.stringify(route) !== JSON.stringify(savedRoute));
  const allStops = useMemo(() => getAllTransportStops(), [customStops, markers]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedSegment = route?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const vertices = useMemo(
    () => (selectedSegment ? segmentToVertices(selectedSegment) : []),
    [selectedSegment],
  );
  const vertexIssues = selectedSegment ? validateVertices(vertices) : [];
  const routeIssues = useMemo(() => {
    if (!route) {
      return new Map<string, string[]>();
    }

    return new Map(
      route.segments.map((segment) => [segment.id, validateVertices(segmentToVertices(segment))]),
    );
  }, [route]);
  const invalidSegmentCount = Array.from(routeIssues.values()).filter((issues) => issues.length > 0)
    .length;
  const otherRoutes = routes.filter((item) => item.id !== selectedRouteId);

  const requestFit = useCallback((coordinates: Coordinate[]) => {
    fitCounter.current += 1;
    setFitRequest({ key: fitCounter.current, coordinates });
  }, []);

  const openRoute = useCallback(
    (nextRoute: CorridorRoute, options?: { segmentId?: string | null; fit?: boolean }) => {
      setSelectedRouteId(nextRoute.id);
      setHistory(createHistory(nextRoute));
      setSavedRoute(nextRoute);
      setSelectedSegmentId(options?.segmentId ?? null);
      setActiveVertexIndex(null);
      setDraft([]);
      setTool("select");
      setStatus(null);

      if (options?.fit !== false) {
        const segment = options?.segmentId
          ? nextRoute.segments.find((item) => item.id === options.segmentId)
          : null;
        requestFit(
          segment
            ? segmentToVertices(segment).map((vertex) => vertex.coordinate)
            : flattenRouteCoordinates(nextRoute),
        );
      }
    },
    [requestFit],
  );

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetch("/api/admin/stops").then((response) => response.json()),
      fetch("/api/admin/routes").then((response) => response.json()),
      fetch("/api/admin/markers").then((response) => response.json()),
    ]).then(([stopsPayload, routesPayload, markersPayload]) => {
      if (cancelled) {
        return;
      }

      const loadedStops = stopsPayload as AdminStop[];
      const loadedRoutes = routesPayload as CorridorRoute[];
      const loadedMarkers = markersPayload as AdminMarker[];

      // Register before anything derives vertices, or custom cities and
      // markers would read as unknown and their legs would look broken.
      registerTransportStops(loadedStops, loadedMarkers);
      setCustomStops(loadedStops);
      setMarkers(loadedMarkers);
      setRoutes(loadedRoutes);
      setPersistedRouteIds(loadedRoutes.map((item) => item.id));
      setLoaded(true);

      const params = new URLSearchParams(window.location.search);
      const wantedRoute =
        loadedRoutes.find((item) => item.id === params.get("route")) ?? loadedRoutes[0] ?? null;

      if (wantedRoute) {
        const wantedSegment = params.get("segment");
        openRoute(wantedRoute, {
          segmentId: wantedRoute.segments.some((segment) => segment.id === wantedSegment)
            ? wantedSegment
            : null,
        });
      }
    });

    fetch("/geo/countries-50m.geojson")
      .then((response) => response.json())
      .then((data: FeatureCollection) => {
        countriesRef.current = data;
      })
      .catch(() => undefined);

    fetch("/geo/cities-50m.json")
      .then((response) => response.json())
      .then((data: RawCity[]) => {
        citiesRef.current = data;
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [openRoute]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  function commit(nextRoute: CorridorRoute) {
    setHistory((current) => (current ? pushHistory(current, nextRoute) : createHistory(nextRoute)));
    setStatus(null);
  }

  function updateSegment(segmentId: string, updater: (segment: CorridorSegment) => CorridorSegment) {
    if (!route) {
      return;
    }

    commit({
      ...route,
      segments: route.segments.map((segment) =>
        segment.id === segmentId ? updater(segment) : segment,
      ),
    });
  }

  function setSegmentVertices(segmentId: string, nextVertices: EditorVertex[]) {
    updateSegment(segmentId, (segment) => verticesToSegment(segment, nextVertices));
  }

  function undo() {
    setHistory((current) => (current ? undoHistory(current) : current));
    setActiveVertexIndex(null);
  }

  function redo() {
    setHistory((current) => (current ? redoHistory(current) : current));
    setActiveVertexIndex(null);
  }

  function confirmDiscard(): boolean {
    return !isDirty || window.confirm("Discard unsaved changes to this corridor?");
  }

  function switchRoute(routeId: string) {
    const nextRoute = routes.find((item) => item.id === routeId);

    if (!nextRoute || !confirmDiscard()) {
      return;
    }

    openRoute(nextRoute);
  }

  function createRoute() {
    if (!confirmDiscard()) {
      return;
    }

    const name = window.prompt("Corridor name (English). You can translate it in the console later.");

    if (!name?.trim()) {
      return;
    }

    const base = slugifyStopId(name) || "corridor";
    let id = base;
    let suffix = 2;

    while (routes.some((item) => item.id === id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }

    const nextRoute: CorridorRoute = {
      id,
      name: { az: name.trim(), en: name.trim(), ru: name.trim() },
      routeColor: NEW_ROUTE_COLORS[routes.length % NEW_ROUTE_COLORS.length],
      type: "primary",
      totalDistanceKm: 0,
      transitTime: { az: "", en: "", ru: "" },
      countries: [],
      description: { az: "", en: "", ru: "" },
      status: "active",
      animationSpeed: 0.1,
      segments: [],
    };

    setRoutes((current) => [...current, nextRoute]);
    openRoute(nextRoute, { fit: false });
    setTool("draw");
  }

  function finishDraft() {
    if (!route) {
      return;
    }

    // A double-click to finish also lands two clicks; drop repeated points.
    const cleaned = draft.filter(
      (vertex, index) =>
        index === 0 ||
        vertex.coordinate[0] !== draft[index - 1].coordinate[0] ||
        vertex.coordinate[1] !== draft[index - 1].coordinate[1],
    );
    const issues = validateVertices(cleaned);

    if (issues.length > 0) {
      setStatus({ kind: "error", text: issues[0] });
      return;
    }

    const stopIds = verticesToStopIds(cleaned);
    const segment = verticesToSegment(
      {
        id: uniqueSegmentId(route, stopIds),
        mode: draftMode,
        from: { az: "", en: "", ru: "" },
        to: { az: "", en: "", ru: "" },
        distanceKm: pathLengthKm(cleaned.map((vertex) => vertex.coordinate)),
        coordinates: [],
        stopIds: [],
      },
      cleaned,
    );

    commit({ ...route, segments: [...route.segments, segment] });
    setStatus({ kind: "success", text: `Leg ${segmentLabel(segment)} added.` });

    if (chainLegs) {
      setDraft([cleaned[cleaned.length - 1]]);
    } else {
      setDraft([]);
      setTool("select");
      setSelectedSegmentId(segment.id);
    }
  }

  function cancelDraft() {
    setDraft([]);
    setTool("select");
  }

  function selectSegmentFromList(segmentId: string) {
    const segment = route?.segments.find((item) => item.id === segmentId);

    setSelectedSegmentId(segmentId);
    setActiveVertexIndex(null);
    setTool("select");

    if (segment) {
      requestFit(segmentToVertices(segment).map((vertex) => vertex.coordinate));
    }
  }

  function moveSegment(segmentId: string, direction: -1 | 1) {
    if (!route) {
      return;
    }

    const index = route.segments.findIndex((segment) => segment.id === segmentId);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= route.segments.length) {
      return;
    }

    const segments = [...route.segments];
    [segments[index], segments[target]] = [segments[target], segments[index]];
    commit({ ...route, segments });
  }

  function deleteSegment(segmentId: string) {
    if (!route || !window.confirm("Delete this leg?")) {
      return;
    }

    commit({ ...route, segments: route.segments.filter((segment) => segment.id !== segmentId) });
    setSelectedSegmentId(null);
    setActiveVertexIndex(null);
  }

  async function saveRoute() {
    if (!route) {
      return;
    }

    if (invalidSegmentCount > 0) {
      setStatus({
        kind: "error",
        text: `${invalidSegmentCount} leg${invalidSegmentCount === 1 ? "" : "s"} still need city endpoints.`,
      });
      return;
    }

    const payload: CorridorRoute = {
      ...route,
      countries: route.countries.length > 0 ? route.countries : countriesFromSegments(route),
      totalDistanceKm:
        route.totalDistanceKm > 0
          ? route.totalDistanceKm
          : route.segments.reduce((total, segment) => total + segment.distanceKm, 0),
    };
    const method = persistedRouteIds.includes(route.id) ? "PATCH" : "POST";
    const url = method === "PATCH" ? `/api/admin/routes/${route.id}` : "/api/admin/routes";

    setSaving(true);

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as
        | CorridorRoute
        | { error?: string }
        | null;

      if (!response.ok || !body || !("id" in body)) {
        setStatus({
          kind: "error",
          text: (body && "error" in body && body.error) || "Failed to save corridor.",
        });
        return;
      }

      setRoutes((current) =>
        current.some((item) => item.id === body.id)
          ? current.map((item) => (item.id === body.id ? body : item))
          : [...current, body],
      );
      setPersistedRouteIds((current) =>
        current.includes(body.id) ? current : [...current, body.id],
      );
      setHistory((current) => (current ? { ...current, present: body } : createHistory(body)));
      setSavedRoute(body);
      setStatus({ kind: "success", text: "Corridor saved." });
    } catch {
      setStatus({ kind: "error", text: "Failed to save corridor." });
    } finally {
      setSaving(false);
    }
  }

  function placeAt(coordinate: Coordinate, kind: "city" | "marker" = placeKind) {
    const nearby = citiesRef.current.find(
      (city) =>
        Math.abs(city.c[0] - coordinate[0]) < CITY_SUGGESTION_TOLERANCE &&
        Math.abs(city.c[1] - coordinate[1]) < CITY_SUGGESTION_TOLERANCE,
    );
    const detectedCountry = findCountryIsoAtPoint(countriesRef.current, coordinate);
    const suggestedName = nearby ? { en: nearby.n, ru: nearby.ru } : null;

    setCityError(null);
    setMarkerError(null);

    if (kind === "marker") {
      setCityDraft(null);
      setMarkerDraft({
        mode: "create",
        coordinate,
        detectedCountry,
        suggestedName,
        routeId: selectedRouteId,
      });
      return;
    }

    setMarkerDraft(null);
    setCityDraft({ mode: "create", coordinate, detectedCountry, suggestedName });
  }

  /** A click on an editable stop: custom cities and markers open their dialog. */
  function editPlace(stop: TransportStop) {
    setCityForVertex(null);

    if (stop.source === "marker") {
      const marker = markers.find((item) => item.id === stop.id);

      if (marker) {
        setMarkerError(null);
        setCityDraft(null);
        setMarkerDraft({
          mode: "edit",
          marker,
          coordinate: marker.coordinates,
          routeId: selectedRouteId,
        });
      }

      return;
    }

    setCityError(null);
    setMarkerDraft(null);
    setCityDraft({ mode: "edit", stop, coordinate: stop.coordinates });
  }

  async function saveMarker(marker: AdminMarker) {
    if (!markerDraft) {
      return;
    }

    const isEdit = markerDraft.mode === "edit" && markerDraft.marker;
    const url = isEdit ? `/api/admin/markers/${markerDraft.marker!.id}` : "/api/admin/markers";

    setMarkerSaving(true);
    setMarkerError(null);

    try {
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marker),
      });
      const body = (await response.json().catch(() => null)) as
        | AdminMarker
        | { error?: string }
        | null;

      if (!response.ok || !body || !("id" in body)) {
        setMarkerError((body && "error" in body && body.error) || "Failed to save marker.");
        return;
      }

      const nextMarkers = markers.some((item) => item.id === body.id)
        ? markers.map((item) => (item.id === body.id ? body : item))
        : [...markers, body];

      registerTransportStops(customStops, nextMarkers);
      setMarkers(nextMarkers);

      const stop = getStopForMarker(body);
      const previous = markerDraft.marker;
      const moved =
        previous &&
        stop?.source === "marker" &&
        (previous.coordinates[0] !== body.coordinates[0] ||
          previous.coordinates[1] !== body.coordinates[1]);

      if (moved && stop) {
        await followMovedCity({ ...stop, id: stop.id });
      }

      if (stop) {
        anchorSavedPlace(stop);
      }

      setMarkerDraft(null);
      setStatus({
        kind: "success",
        text: `Marker ${body.name.en} ${isEdit ? "updated" : "added"}${
          stop && stop.source !== "marker" ? ` (legs snap to ${stop.name.en} here)` : ""
        }.`,
      });
    } catch {
      setMarkerError("Failed to save marker.");
    } finally {
      setMarkerSaving(false);
    }
  }

  async function deleteMarker() {
    if (!markerDraft?.marker || !window.confirm(`Delete marker ${markerDraft.marker.name.en}?`)) {
      return;
    }

    setMarkerSaving(true);
    setMarkerError(null);

    try {
      const response = await fetch(`/api/admin/markers/${markerDraft.marker.id}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMarkerError(body?.error || "Failed to delete marker.");
        return;
      }

      const nextMarkers = markers.filter((item) => item.id !== markerDraft.marker!.id);
      registerTransportStops(customStops, nextMarkers);
      setMarkers(nextMarkers);
      setMarkerDraft(null);
      setStatus({ kind: "success", text: "Marker deleted." });
    } finally {
      setMarkerSaving(false);
    }
  }

  /**
   * After a city or marker is saved: pin the waiting free vertex to it, or
   * while drawing, continue the line through it.
   */
  function anchorSavedPlace(stop: TransportStop) {
    if (cityForVertex && route) {
      const segment = route.segments.find((item) => item.id === cityForVertex.segmentId);

      if (segment) {
        const nextVertices = segmentToVertices(segment).map((vertex, index) =>
          index === cityForVertex.index
            ? { coordinate: stop.coordinates, stopId: stop.id }
            : vertex,
        );
        setSegmentVertices(segment.id, nextVertices);
      }

      setCityForVertex(null);
      setTool("select");
    } else if (tool === "draw") {
      setDraft((current) => [...current, { coordinate: stop.coordinates, stopId: stop.id }]);
    }
  }

  function makeVertexPlace(kind: "city" | "marker") {
    if (!selectedSegment || activeVertexIndex === null) {
      return;
    }

    const vertex = vertices[activeVertexIndex];

    if (!vertex || vertex.stopId) {
      return;
    }

    setCityForVertex({ segmentId: selectedSegment.id, index: activeVertexIndex });
    placeAt(vertex.coordinate, kind);
  }

  async function saveCity(stop: AdminStop) {
    if (!cityDraft) {
      return;
    }

    const isEdit = cityDraft.mode === "edit" && cityDraft.stop;
    const url = isEdit ? `/api/admin/stops/${cityDraft.stop!.id}` : "/api/admin/stops";

    setCitySaving(true);
    setCityError(null);

    try {
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stop),
      });
      const body = (await response.json().catch(() => null)) as
        | AdminStop
        | { error?: string }
        | null;

      if (!response.ok || !body || !("id" in body)) {
        setCityError((body && "error" in body && body.error) || "Failed to save city.");
        return;
      }

      const nextStops = customStops.some((item) => item.id === body.id)
        ? customStops.map((item) => (item.id === body.id ? body : item))
        : [...customStops, body];

      registerTransportStops(nextStops, markers);
      setCustomStops(nextStops);

      const previous = cityDraft.stop;
      const moved =
        previous &&
        (previous.coordinates[0] !== body.coordinates[0] ||
          previous.coordinates[1] !== body.coordinates[1]);

      if (moved) {
        await followMovedCity(body);
      }

      anchorSavedPlace({ ...body, source: "custom" });
      setCityDraft(null);
      setStatus({ kind: "success", text: `City ${body.name.en} ${isEdit ? "updated" : "added"}.` });
    } catch {
      setCityError("Failed to save city.");
    } finally {
      setCitySaving(false);
    }
  }

  /** Drags every leg vertex pinned to a moved city along with it. */
  async function followMovedCity(stop: Pick<AdminStop, "id" | "coordinates">) {
    const changedOthers = relocateStopInRoutes(otherRoutes, stop.id, stop.coordinates);

    for (const changed of changedOthers) {
      const response = await fetch(`/api/admin/routes/${changed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changed),
      });

      if (response.ok) {
        const saved = (await response.json()) as CorridorRoute;
        setRoutes((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      }
    }

    if (route) {
      const [changedDraft] = relocateStopInRoutes([route], stop.id, stop.coordinates);

      if (changedDraft) {
        commit(changedDraft);
      }
    }
  }

  async function deleteCity() {
    if (!cityDraft?.stop || !window.confirm(`Delete city ${cityDraft.stop.name.en}?`)) {
      return;
    }

    setCitySaving(true);
    setCityError(null);

    try {
      const response = await fetch(`/api/admin/stops/${cityDraft.stop.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setCityError(body?.error || "Failed to delete city.");
        return;
      }

      const nextStops = customStops.filter((item) => item.id !== cityDraft.stop!.id);
      registerTransportStops(nextStops, markers);
      setCustomStops(nextStops);
      setCityDraft(null);
      setStatus({ kind: "success", text: "City deleted." });
    } finally {
      setCitySaving(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || cityDraft || markerDraft) {
        return;
      }

      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRoute();
        return;
      }

      if (event.key === "Escape") {
        if (tool === "draw") {
          cancelDraft();
        } else if (tool === "city") {
          setTool("select");
        } else {
          setActiveVertexIndex(null);
        }

        return;
      }

      if (event.key === "Enter" && tool === "draw") {
        event.preventDefault();
        finishDraft();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        if (tool === "draw") {
          setDraft((current) => current.slice(0, -1));
        } else if (
          tool === "select" &&
          selectedSegment &&
          activeVertexIndex !== null &&
          activeVertexIndex > 0 &&
          activeVertexIndex < vertices.length - 1
        ) {
          setSegmentVertices(
            selectedSegment.id,
            vertices.filter((_, index) => index !== activeVertexIndex),
          );
          setActiveVertexIndex(null);
        }

        return;
      }

      if (!meta && event.key.toLowerCase() === "v") {
        setTool("select");
      } else if (!meta && event.key.toLowerCase() === "d" && route) {
        setTool("draw");
      } else if (!meta && event.key.toLowerCase() === "c") {
        setTool("city");
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const activeVertex = activeVertexIndex !== null ? vertices[activeVertexIndex] ?? null : null;
  const canUndo = Boolean(history && history.past.length > 0);
  const canRedo = Boolean(history && history.future.length > 0);

  return (
    <div className="admin-shell flex h-screen w-screen overflow-hidden" lang="en">
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-[var(--hc-line)] bg-[var(--hc-panel)]">
        <header className="border-b border-[var(--hc-line)] px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <a href="/admin" className="hc-btn hc-btn--xs" title="Back to console">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Console
            </a>
            <div className="flex items-center gap-2">
              <AdminThemeToggle />
            </div>
          </div>
          <p className="hc-eyebrow mt-3">Map editor</p>
          <div className="mt-2 flex gap-2">
            <select
              value={selectedRouteId ?? ""}
              onChange={(event) => switchRoute(event.target.value)}
              className="hc-field"
              disabled={!loaded}
            >
              {routes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name.en || item.id}
                </option>
              ))}
              {routes.length === 0 ? <option value="">No corridors yet</option> : null}
            </select>
            <button
              type="button"
              onClick={createRoute}
              className="hc-btn hc-btn--xs shrink-0"
              title="New corridor"
              disabled={!loaded}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New
            </button>
          </div>
        </header>

        <div className="border-b border-[var(--hc-line)] px-4 py-3">
          <div className="hc-switch w-full" role="toolbar" aria-label="Tools">
            <button
              type="button"
              data-active={tool === "select"}
              onClick={() => setTool("select")}
              title="Select & reshape legs (V)"
              className="flex-1"
            >
              <MousePointer2 className="h-4 w-4" aria-hidden="true" />
              Select
            </button>
            <button
              type="button"
              data-active={tool === "draw"}
              onClick={() => setTool("draw")}
              disabled={!route}
              title="Draw a new leg (D)"
              className="flex-1"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Draw leg
            </button>
            <button
              type="button"
              data-active={tool === "city"}
              onClick={() => setTool("city")}
              title="Add or edit cities and markers (C)"
              className="flex-1"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Place
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="hc-btn hc-btn--xs"
              title="Undo (⌘Z)"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="hc-btn hc-btn--xs"
              title="Redo (⇧⌘Z)"
            >
              <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => route && requestFit(flattenRouteCoordinates(route))}
              disabled={!route || route.segments.length === 0}
              className="hc-btn hc-btn--xs"
              title="Fit corridor"
            >
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => void saveRoute()}
              disabled={!route || !isDirty || saving}
              className="hc-btn hc-btn--xs hc-btn--primary ml-auto"
              title="Save corridor (⌘S)"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {saving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
            </button>
          </div>

          <div className="mt-2 min-h-[1.1rem]" aria-live="polite">
            {status ? (
              <p
                className={`hc-mono text-xs ${
                  status.kind === "error" ? "text-[var(--hc-rose)]" : "text-[var(--hc-cyan)]"
                }`}
              >
                {status.kind === "error" ? "⚠" : "✓"} {status.text}
              </p>
            ) : invalidSegmentCount > 0 ? (
              <p className="hc-mono text-xs text-[var(--hc-rose)]">
                ⚠ {invalidSegmentCount} leg{invalidSegmentCount === 1 ? "" : "s"} need city endpoints.
              </p>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {tool === "draw" ? (
            <section className="border-b border-[var(--hc-line)] px-4 py-3">
              <p className="hc-label">Drawing a leg</p>
              <p className="mt-1.5 text-xs text-[var(--hc-muted)]">
                {draft.length === 0
                  ? "Click a city to start. Cities snap when the cursor is near them."
                  : "Click to add bend points, click cities to pass through them. Double-click or press Enter on the last city to finish; Backspace removes the last point; Esc cancels."}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {(["rail", "ship", "road"] as TransportMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDraftMode(mode)}
                    className="hc-btn hc-btn--xs justify-center"
                    style={
                      draftMode === mode
                        ? {
                            borderColor: TRANSPORT_MODE_META[mode].color,
                            background: `${TRANSPORT_MODE_META[mode].color}22`,
                          }
                        : undefined
                    }
                  >
                    <ModeGlyph mode={mode} />
                    {mode}
                  </button>
                ))}
              </div>
              {draft.length > 0 ? (
                <p className="hc-mono mt-3 text-xs text-[var(--hc-text)]">
                  {verticesToStopIds(draft)
                    .map((stopId) => getTransportStop(stopId)?.name.en ?? stopId)
                    .join(" → ")}
                  <span className="text-[var(--hc-muted)]">
                    {" "}
                    · {draft.length} pt{draft.length === 1 ? "" : "s"} ·{" "}
                    {pathLengthKm(draft.map((vertex) => vertex.coordinate))} km
                  </span>
                </p>
              ) : null}
              <label className="mt-3 flex items-center gap-2 text-xs text-[var(--hc-muted)]">
                <input
                  type="checkbox"
                  checked={chainLegs}
                  onChange={(event) => setChainLegs(event.target.checked)}
                />
                Chain legs: start the next leg where this one ends
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={finishDraft}
                  disabled={draft.length < 2}
                  className="hc-btn hc-btn--xs hc-btn--primary"
                >
                  Finish leg
                </button>
                <button type="button" onClick={cancelDraft} className="hc-btn hc-btn--xs">
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          {tool === "city" ? (
            <section className="border-b border-[var(--hc-line)] px-4 py-3">
              <p className="hc-label">Place on click</p>
              <div className="hc-switch mt-2 w-full">
                <button
                  type="button"
                  data-active={placeKind === "city"}
                  onClick={() => setPlaceKind("city")}
                  className="flex-1"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  City
                </button>
                <button
                  type="button"
                  data-active={placeKind === "marker"}
                  onClick={() => setPlaceKind("marker")}
                  className="flex-1"
                >
                  <MapPinned className="h-4 w-4" aria-hidden="true" />
                  Marker
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--hc-muted)]">
                {placeKind === "city"
                  ? "Click the map to add a city there."
                  : "Click the map to add a port, terminal or hub there. It shows on the public map with its icon and popup, and legs can start or end on it."}{" "}
                Click an amber city or pink marker to edit or delete it. Built-in cities (white /
                blue) cannot be edited here.
              </p>
              <p className="hc-mono mt-2 text-xs text-[var(--hc-muted)]">
                {customStops.length} custom cities · {markers.length} markers ·{" "}
                {allStops.filter((stop) => !stop.source || stop.source === "catalog").length}{" "}
                built-in cities
              </p>
            </section>
          ) : null}

          {selectedSegment ? (
            <section className="border-b border-[var(--hc-line)] px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="hc-label">Selected leg</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--hc-text)]">
                    {segmentLabel(selectedSegment)}
                  </p>
                  <p className="hc-mono mt-0.5 truncate text-[11px] text-[var(--hc-faint)]">
                    {selectedSegment.id}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => requestFit(vertices.map((vertex) => vertex.coordinate))}
                    className="hc-btn hc-btn--xs"
                    title="Fit leg"
                  >
                    <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSegment(selectedSegment.id)}
                    className="hc-btn hc-btn--xs hc-btn--danger"
                    title="Delete leg"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {vertexIssues.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {vertexIssues.map((issue) => (
                    <li key={issue} className="hc-mono text-xs text-[var(--hc-rose)]">
                      ⚠ {issue}
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="mt-2 text-xs text-[var(--hc-muted)]">
                Drag points to reshape. Click the line or a hollow midpoint to add a point; drop a
                point on a city to route through it. Double-click a point (or press Delete) to remove
                it.
              </p>

              <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
                <label className="block">
                  <span className="hc-label mb-1.5">Mode</span>
                  <select
                    value={selectedSegment.mode}
                    onChange={(event) =>
                      updateSegment(selectedSegment.id, (segment) => ({
                        ...segment,
                        mode: event.target.value as TransportMode,
                      }))
                    }
                    className="hc-field"
                  >
                    <option value="rail">Rail</option>
                    <option value="ship">Ship</option>
                    <option value="road">Road</option>
                  </select>
                </label>
                <label className="block">
                  <span className="hc-label mb-1.5">Distance (km)</span>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={selectedSegment.distanceKm}
                      onChange={(event) =>
                        updateSegment(selectedSegment.id, (segment) => ({
                          ...segment,
                          distanceKm: Number(event.target.value),
                        }))
                      }
                      className="hc-field hc-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateSegment(selectedSegment.id, (segment) => ({
                          ...segment,
                          distanceKm: pathLengthKm(vertices.map((vertex) => vertex.coordinate)),
                        }))
                      }
                      className="hc-btn hc-btn--xs shrink-0"
                      title="Measure along the drawn line"
                    >
                      <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </label>
              </div>

              <label className="mt-3 block">
                <span className="hc-label mb-1.5">Line style</span>
                <select
                  value={selectedSegment.lineStyle ?? "solid"}
                  onChange={(event) =>
                    updateSegment(selectedSegment.id, (segment) => ({
                      ...segment,
                      lineStyle:
                        event.target.value === "dotted" ? ("dotted" as SegmentLineStyle) : undefined,
                    }))
                  }
                  className="hc-field"
                >
                  <option value="solid">Solid</option>
                  <option value="dotted">Dotted (planned / unbuilt)</option>
                </select>
              </label>

              <div className="mt-3">
                <span className="hc-label mb-1.5">Stops on this leg</span>
                <div className="flex flex-wrap gap-1.5">
                  {verticesToStopIds(vertices).map((stopId, index, all) => {
                    const stop = getTransportStop(stopId);
                    const isEnd = index === 0 || index === all.length - 1;

                    return (
                      <button
                        key={`${stopId}-${index}`}
                        type="button"
                        disabled={isEnd}
                        onClick={() => {
                          // Un-pin an intermediate city: the point stays as a bend.
                          setSegmentVertices(
                            selectedSegment.id,
                            vertices.map((vertex) =>
                              vertex.stopId === stopId ? { ...vertex, stopId: null } : vertex,
                            ),
                          );
                        }}
                        className="hc-chip disabled:cursor-default"
                        title={isEnd ? "Endpoint" : "Remove city from leg (keeps the bend)"}
                      >
                        <span aria-hidden="true">
                          {getCountryFlagEmoji(stop?.countryCode ?? "")}
                        </span>
                        {stop?.name.en ?? stopId}
                        {isEnd ? null : <span className="text-[var(--hc-faint)]">×</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeVertex ? (
                <div className="mt-3 rounded-lg border border-[var(--hc-line)] bg-[var(--hc-panel-2)] px-3 py-2">
                  <p className="hc-mono text-xs text-[var(--hc-muted)]">
                    Point {activeVertexIndex! + 1} of {vertices.length} ·{" "}
                    {activeVertex.coordinate[0].toFixed(4)}, {activeVertex.coordinate[1].toFixed(4)}
                    {activeVertex.stopId
                      ? ` · ${getTransportStop(activeVertex.stopId)?.name.en ?? activeVertex.stopId}`
                      : " · bend"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {!activeVertex.stopId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => makeVertexPlace("city")}
                          className="hc-btn hc-btn--xs"
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          Make this point a city
                        </button>
                        <button
                          type="button"
                          onClick={() => makeVertexPlace("marker")}
                          className="hc-btn hc-btn--xs"
                        >
                          <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
                          Make this point a marker
                        </button>
                      </>
                    ) : null}
                    {activeVertexIndex! > 0 && activeVertexIndex! < vertices.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSegmentVertices(
                            selectedSegment.id,
                            vertices.filter((_, index) => index !== activeVertexIndex),
                          );
                          setActiveVertexIndex(null);
                        }}
                        className="hc-btn hc-btn--xs hc-btn--danger"
                      >
                        Remove point
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSegmentVertices(selectedSegment.id, reverseVertices(vertices))
                  }
                  className="hc-btn hc-btn--xs"
                  title="Swap start and end"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                  Reverse
                </button>
                <button
                  type="button"
                  onClick={() => moveSegment(selectedSegment.id, -1)}
                  className="hc-btn hc-btn--xs"
                  title="Move up in the leg order"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSegment(selectedSegment.id, 1)}
                  className="hc-btn hc-btn--xs"
                  title="Move down in the leg order"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft([vertices[vertices.length - 1]]);
                    setDraftMode(selectedSegment.mode);
                    setTool("draw");
                  }}
                  disabled={!vertices[vertices.length - 1]?.stopId}
                  className="hc-btn hc-btn--xs"
                  title="Start a new leg from this leg's end"
                >
                  <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                  Continue from end
                </button>
              </div>

              <details className="mt-3">
                <summary className="hc-label cursor-pointer">Labels</summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["from", "to"] as const).map((field) =>
                    (["en", "az", "ru"] as const).map((language) => (
                      <label key={`${field}-${language}`} className="block">
                        <span className="hc-label mb-1">
                          {field} · {language}
                        </span>
                        <input
                          value={selectedSegment[field][language]}
                          onChange={(event) =>
                            updateSegment(selectedSegment.id, (segment) => ({
                              ...segment,
                              [field]: { ...segment[field], [language]: event.target.value },
                            }))
                          }
                          className="hc-field"
                        />
                      </label>
                    )),
                  )}
                </div>
              </details>
            </section>
          ) : null}

          <section className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="hc-label">Legs</p>
              <span className="hc-mono text-xs text-[var(--hc-muted)]">
                {route?.segments.length ?? 0}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {route?.segments.map((segment, index) => {
                const issues = routeIssues.get(segment.id) ?? [];

                return (
                  <button
                    key={segment.id}
                    type="button"
                    data-active={segment.id === selectedSegmentId}
                    onClick={() => selectSegmentFromList(segment.id)}
                    className="hc-rail-item !py-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="hc-index !h-6 !w-6 text-[11px]">{index + 1}</span>
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded"
                        style={{
                          color: TRANSPORT_MODE_META[segment.mode].color,
                          background: `${TRANSPORT_MODE_META[segment.mode].color}22`,
                        }}
                      >
                        <ModeGlyph mode={segment.mode} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--hc-text)]">
                          {segmentLabel(segment)}
                        </span>
                        <span className="hc-mono block text-[11px] text-[var(--hc-muted)]">
                          {segment.distanceKm} km · {(segment.stopIds ?? []).length} stops
                          {segment.lineStyle === "dotted" ? " · dotted" : ""}
                          {issues.length > 0 ? (
                            <span className="text-[var(--hc-rose)]"> · needs fixing</span>
                          ) : null}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
              {route && route.segments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--hc-line-strong)] px-3 py-5 text-center text-xs text-[var(--hc-muted)]">
                  No legs yet. Pick <span className="text-[var(--hc-text)]">Draw leg</span> and
                  click a city on the map to start.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <footer className="border-t border-[var(--hc-line)] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOtherRoutes((current) => !current)}
              className="hc-btn hc-btn--xs"
              title="Toggle other corridors"
            >
              {showOtherRoutes ? (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Others
            </button>
            <button
              type="button"
              onClick={() => setShowCities((current) => !current)}
              className="hc-btn hc-btn--xs"
              title="Toggle city markers"
            >
              {showCities ? (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Cities
            </button>
            <select
              value={basemap}
              onChange={(event) => setBasemap(event.target.value as Basemap | "dark")}
              className="hc-field ml-auto !w-auto !py-1 text-xs"
              aria-label="Basemap"
            >
              <option value="default">Default map</option>
              <option value="styled">Styled map</option>
              <option value="dark">Dark map</option>
            </select>
          </div>
        </footer>
      </aside>

      <main className="relative min-w-0 flex-1">
        <EditorMap
          tileUrl={basemapTileUrl(basemap, "en")}
          route={route}
          otherRoutes={otherRoutes}
          showOtherRoutes={showOtherRoutes}
          stops={allStops}
          showCities={showCities}
          tool={tool}
          selectedSegmentId={selectedSegmentId}
          vertices={vertices}
          selectedLineStyle={selectedSegment?.lineStyle ?? "solid"}
          activeVertexIndex={activeVertexIndex}
          draft={draft}
          pendingCity={cityDraft?.coordinate ?? markerDraft?.coordinate ?? null}
          fitRequest={fitRequest}
          onSelectSegment={(segmentId) => {
            setSelectedSegmentId(segmentId);
            setActiveVertexIndex(null);
          }}
          onVerticesChange={(nextVertices) => {
            if (selectedSegment) {
              setSegmentVertices(selectedSegment.id, nextVertices);
            }
          }}
          onActiveVertexChange={setActiveVertexIndex}
          onDraftChange={setDraft}
          onDraftFinish={finishDraft}
          onCityPlace={(coordinate) => placeAt(coordinate)}
          onStopEdit={editPlace}
          onPendingCityMove={(coordinate) => {
            setCityDraft((current) => (current ? { ...current, coordinate } : current));
            setMarkerDraft((current) => (current ? { ...current, coordinate } : current));
          }}
        />

        {markerDraft ? (
          <MarkerDialog
            key={`${markerDraft.mode}-${markerDraft.marker?.id ?? "new"}`}
            draft={markerDraft}
            saving={markerSaving}
            error={markerError}
            onSave={(marker) => void saveMarker(marker)}
            onDelete={markerDraft.mode === "edit" ? () => void deleteMarker() : undefined}
            onCancel={() => {
              setMarkerDraft(null);
              setCityForVertex(null);
            }}
            onCoordinateChange={(coordinate) =>
              setMarkerDraft((current) => (current ? { ...current, coordinate } : current))
            }
          />
        ) : null}

        {cityDraft ? (
          <CityDialog
            key={`${cityDraft.mode}-${cityDraft.stop?.id ?? "new"}`}
            draft={cityDraft}
            saving={citySaving}
            error={cityError}
            onSave={(stop) => void saveCity(stop)}
            onDelete={cityDraft.mode === "edit" ? () => void deleteCity() : undefined}
            onCancel={() => {
              setCityDraft(null);
              setCityForVertex(null);
            }}
            onCoordinateChange={(coordinate) =>
              setCityDraft((current) => (current ? { ...current, coordinate } : current))
            }
          />
        ) : null}

        {!loaded ? (
          <div className="absolute inset-0 z-[1200] grid place-items-center bg-[rgba(8,22,38,0.55)] text-sm text-white">
            Loading corridors…
          </div>
        ) : null}
      </main>
    </div>
  );
}
