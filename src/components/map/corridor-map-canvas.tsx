"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvent,
} from "react-leaflet";
import type { TFunction } from "i18next";

import {
  BAKU_PORT,
  DEFAULT_MAP_VIEW,
  getLocalizedText,
  TRANSPORT_MODE_META,
} from "@/data/corridors";
import { DOTTED_STRETCHES } from "@/data/dotted-stretches";
import { getMarkerIconSvg } from "@/data/marker-icons";
import { getTransportStop } from "@/data/transport-stops";
import { collectRouteTerminalStopIds } from "@/lib/corridor-stop-utils";
import {
  flattenRouteCoordinates,
  getCorridorOffsetPx,
  getSegmentRenderCoordinates,
  offsetPathPixels,
  splitSegmentForDotting,
} from "@/lib/map-utils";
import {
  getMarkerTier,
  isMarkerVisibleAtZoom,
  LABEL_MIN_ZOOM,
  MARKER_MIN_ZOOM,
} from "@/lib/marker-visibility";
import { VehicleLayer } from "@/components/map/vehicle-layer";
import type { AdminMarker, MarkerCategory } from "@/types/admin";
import type { Coordinate, CorridorRoute, LocalizedText, SupportedLocale, TransportMode } from "@/types/map";

function createMarkerIcon(
  marker: Pick<AdminMarker, "category" | "icon">,
  theme: "dark" | "light",
  options?: { size?: number; pulse?: boolean },
) {
  const markerMeta: Record<
    "dark" | "light",
    Record<AdminMarker["category"], { color: string; glow: string; shadow: string }>
  > = {
    light: {
      port: { color: "#0284c7", glow: "#38bdf8", shadow: "rgba(14, 116, 144, 0.26)" },
      station: { color: "#d97706", glow: "#f59e0b", shadow: "rgba(180, 83, 9, 0.24)" },
      border: { color: "#db2777", glow: "#f472b6", shadow: "rgba(190, 24, 93, 0.22)" },
      city: { color: "#0f766e", glow: "#2dd4bf", shadow: "rgba(13, 148, 136, 0.22)" },
    },
    dark: {
      port: { color: "#38bdf8", glow: "#7dd3fc", shadow: "rgba(14, 165, 233, 0.34)" },
      station: { color: "#fbbf24", glow: "#fde68a", shadow: "rgba(245, 158, 11, 0.32)" },
      border: { color: "#f472b6", glow: "#f9a8d4", shadow: "rgba(244, 114, 182, 0.3)" },
      city: { color: "#34d399", glow: "#6ee7b7", shadow: "rgba(52, 211, 153, 0.28)" },
    },
  };

  const meta = markerMeta[theme][marker.category];
  const size = options?.size ?? 36;
  const pulse = options?.pulse ?? false;
  const ringInset = Math.max(4, Math.round(size * 0.1));
  const coreSize = Math.max(size - ringInset * 2, 24);
  const glyphSize = Math.max(14, Math.round(coreSize * 0.54));
  const svgMarkup = getMarkerIconSvg(marker.icon, marker.category);

  return L.divIcon({
    className: "baku-port-icon-wrapper",
    html: `
      <div class="baku-port-icon" style="width:${size}px;height:${size}px;">
        <span class="baku-port-icon__ring" style="background: radial-gradient(circle, ${meta.glow}44, transparent 68%); animation:${pulse ? "baku-pulse 2.6s ease-in-out infinite" : "none"};"></span>
        <span class="baku-port-icon__core" style="--marker-glyph-size:${glyphSize}px; inset:${ringInset}px; background: linear-gradient(180deg, ${meta.glow}, ${meta.color}); box-shadow:0 10px 24px ${meta.shadow}, inset 0 1px 0 rgba(255,255,255,0.28); border-color:${theme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.75)"}; color: ${theme === "dark" ? "#f8fafc" : "#ffffff"}; width:${coreSize}px; height:${coreSize}px; margin:auto;">
          ${svgMarkup}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, Math.round(-size * 0.42)],
  });
}

function createStopMarkerIcon(color: string) {
  return L.divIcon({
    className: "route-stop-icon-wrapper",
    html: `<span class="route-stop-icon" style="--stop-ring-color:${color};"></span>`,
    iconSize: [11, 11],
    iconAnchor: [5.5, 5.5],
  });
}

interface RouteStopMarkerEntry {
  stopId: string;
  coordinate: Coordinate;
  name: LocalizedText;
  routeIds: string[];
  colorByRoute: Map<string, string>;
  defaultColor: string;
}

function collectRouteStopMarkers(
  routes: CorridorRoute[],
  existingMarkers: AdminMarker[],
): RouteStopMarkerEntry[] {
  const stopEntries = new Map<
    string,
    { coordinate: Coordinate; name: LocalizedText; routeIds: Set<string>; colorByRoute: Map<string, string> }
  >();

  routes.forEach((route) => {
    route.segments.forEach((segment) => {
      (segment.stopIds ?? []).forEach((stopId) => {
        const stop = getTransportStop(stopId);

        if (!stop || stop.editorVisible === false) {
          return;
        }

        const entry =
          stopEntries.get(stopId) ??
          {
            coordinate: stop.coordinates,
            name: stop.name,
            routeIds: new Set<string>(),
            colorByRoute: new Map<string, string>(),
          };

        entry.routeIds.add(route.id);
        entry.colorByRoute.set(route.id, route.routeColor);
        stopEntries.set(stopId, entry);
      });
    });
  });

  return Array.from(stopEntries.entries())
    .filter(
      ([, entry]) =>
        !existingMarkers.some((marker) =>
          areCoordinatesNear(marker.coordinates, entry.coordinate, 0.001),
        ),
    )
    .map(([stopId, entry]) => ({
      stopId,
      coordinate: entry.coordinate,
      name: entry.name,
      routeIds: Array.from(entry.routeIds),
      colorByRoute: entry.colorByRoute,
      defaultColor: entry.colorByRoute.values().next().value as string,
    }));
}

function inferEndpointCategory(mode: TransportMode): MarkerCategory {
  if (mode === "ship") {
    return "port";
  }

  if (mode === "rail") {
    return "station";
  }

  return "city";
}

function inferEndpointIcon(category: MarkerCategory) {
  if (category === "port") {
    return "fas:anchor";
  }

  if (category === "station") {
    return "fas:train";
  }

  return "fas:location-dot";
}

function createEndpointDescription(
  routeName: LocalizedText,
  type: "start" | "end",
): LocalizedText {
  return {
    az:
      type === "start"
        ? `${routeName.az} dəhlizinin başlanğıc nöqtəsi.`
        : `${routeName.az} dəhlizinin son nöqtəsi.`,
    en:
      type === "start"
        ? `Starting location of the ${routeName.en}.`
        : `Ending location of the ${routeName.en}.`,
    ru:
      type === "start"
        ? `Начальная точка маршрута ${routeName.ru}.`
        : `Конечная точка маршрута ${routeName.ru}.`,
  };
}

function mergeRouteEndpointMarkers(
  baseMarkers: AdminMarker[],
  routes: CorridorRoute[],
): AdminMarker[] {
  const mergedMarkers = new Map(
    baseMarkers.map((marker) => [
      marker.id,
      {
        ...marker,
        connectedCorridorIds: Array.from(new Set(marker.connectedCorridorIds ?? [])),
      },
    ]),
  );

  routes.forEach((route) => {
    const firstSegment = route.segments[0];
    const lastSegment = route.segments[route.segments.length - 1];

    if (!firstSegment || !lastSegment) {
      return;
    }

    const endpoints = [
      {
        type: "start" as const,
        stopId: firstSegment.stopIds?.[0] ?? null,
        fallbackCoordinate: firstSegment.coordinates[0],
        label: firstSegment.from,
        mode: firstSegment.mode,
      },
      {
        type: "end" as const,
        stopId: lastSegment.stopIds?.[lastSegment.stopIds.length - 1] ?? null,
        fallbackCoordinate: lastSegment.coordinates[lastSegment.coordinates.length - 1],
        label: lastSegment.to,
        mode: lastSegment.mode,
      },
    ];

    endpoints.forEach((endpoint) => {
      const stop = endpoint.stopId ? getTransportStop(endpoint.stopId) : null;
      const coordinate = stop?.coordinates ?? endpoint.fallbackCoordinate;

      if (!coordinate) {
        return;
      }

      const existingMarker = Array.from(mergedMarkers.values()).find((marker) =>
        areCoordinatesNear(marker.coordinates, coordinate, 0.001),
      );

      if (existingMarker) {
        mergedMarkers.set(existingMarker.id, {
          ...existingMarker,
          connectedCorridorIds: Array.from(
            new Set([...existingMarker.connectedCorridorIds, route.id]),
          ),
        });

        return;
      }

      const category = inferEndpointCategory(endpoint.mode);
      const syntheticMarker: AdminMarker = {
        id: `${route.id}-${endpoint.type}-marker`,
        name: stop?.name ?? endpoint.label,
        description: createEndpointDescription(route.name, endpoint.type),
        category,
        icon: inferEndpointIcon(category),
        coordinates: coordinate,
        connectedCorridorIds: [route.id],
      };

      mergedMarkers.set(syntheticMarker.id, syntheticMarker);
    });
  });

  return Array.from(mergedMarkers.values());
}

function areCoordinatesNear(first: Coordinate, second: Coordinate, tolerance = 0.02) {
  return (
    Math.abs(first[0] - second[0]) <= tolerance &&
    Math.abs(first[1] - second[1]) <= tolerance
  );
}

function getConnectedRouteIdsForMarker(marker: AdminMarker, routes: CorridorRoute[]) {
  const connectedRouteIds = new Set(marker.connectedCorridorIds ?? []);

  routes.forEach((route) => {
    const touchesMarker = route.segments.some((segment) => {
      const matchesStopId = (segment.stopIds ?? []).includes(marker.id);
      const matchesCoordinate = segment.coordinates.some((coordinate) =>
        areCoordinatesNear(coordinate, marker.coordinates),
      );

      return matchesStopId || matchesCoordinate;
    });

    if (touchesMarker) {
      connectedRouteIds.add(route.id);
    }
  });

  return Array.from(connectedRouteIds);
}

function getAvailableConnectedRouteIdsForMarker(
  marker: AdminMarker,
  routes: CorridorRoute[],
) {
  const availableRouteIds = new Set(routes.map((route) => route.id));

  return getConnectedRouteIdsForMarker(marker, routes).filter((routeId) =>
    availableRouteIds.has(routeId),
  );
}

function MapClickHandler({ onClearSelection }: { onClearSelection: () => void }) {
  useMapEvent("click", (event) => {
    if ((event.originalEvent.target as HTMLElement)?.closest(".leaflet-interactive")) {
      return;
    }

    onClearSelection();
  });

  return null;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  useMapEvent("zoomend", (event) => {
    onZoomChange(event.target.getZoom());
  });

  return null;
}

function MapResetController({ resetCount }: { resetCount: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(DEFAULT_MAP_VIEW.center, DEFAULT_MAP_VIEW.zoom, {
      animate: true,
      duration: 1.2,
    });
  }, [map, resetCount]);

  return null;
}

function getSelectionPadding(
  viewportWidth: number,
  viewportHeight: number,
  options: { hasDetailsPanel: boolean; isMapOnlyMode: boolean },
) {
  if (options.isMapOnlyMode) {
    return {
      paddingTopLeft: L.point(64, 64),
      paddingBottomRight: L.point(64, 64),
    };
  }

  if (viewportWidth >= 1280) {
    return {
      paddingTopLeft: L.point(470, 96),
      paddingBottomRight: L.point(options.hasDetailsPanel ? 460 : 80, 96),
    };
  }

  if (viewportWidth >= 768) {
    return {
      paddingTopLeft: L.point(72, 72),
      paddingBottomRight: L.point(72, options.hasDetailsPanel ? 320 : 96),
    };
  }

  return {
    paddingTopLeft: L.point(40, 40),
    paddingBottomRight: L.point(40, options.hasDetailsPanel ? Math.round(viewportHeight * 0.62) : 72),
  };
}

/**
 * Frames a corridor, but only when asked.
 *
 * Framing used to follow the selection, which meant every click on a line threw
 * away whatever zoom the user had set. It is now driven by an explicit counter —
 * the same shape as `MapResetController` — so selecting a segment leaves the
 * camera alone and only the deliberate jumps (a corridor button in a port popup,
 * Reset view) move it.
 */
function SelectionController({
  route,
  hasDetailsPanel,
  isMapOnlyMode,
  frameCount,
}: {
  route: CorridorRoute | null;
  hasDetailsPanel: boolean;
  isMapOnlyMode: boolean;
  frameCount: number;
}) {
  const map = useMap();
  const lastFrameCountRef = useRef(frameCount);

  useEffect(() => {
    if (lastFrameCountRef.current === frameCount) {
      return;
    }

    lastFrameCountRef.current = frameCount;

    if (!route) {
      return;
    }

    const coordinates = flattenRouteCoordinates(route);

    if (coordinates.length < 2) {
      map.flyTo(coordinates[0] ?? DEFAULT_MAP_VIEW.center, 6, {
        animate: true,
        duration: 1,
      });
      return;
    }

    const padding = getSelectionPadding(window.innerWidth, window.innerHeight, {
      hasDetailsPanel,
      isMapOnlyMode,
    });

    map.fitBounds(coordinates, {
      animate: true,
      duration: 1,
      paddingTopLeft: padding.paddingTopLeft,
      paddingBottomRight: padding.paddingBottomRight,
    });
  }, [frameCount, hasDetailsPanel, isMapOnlyMode, map, route]);

  return null;
}

/**
 * Draws every visible corridor, offset into its own lane.
 *
 * Split out of the canvas so it can call `useMap()` — the offset is computed in
 * projected pixel space and has to be recomputed whenever the zoom changes, or
 * the lanes would widen and narrow as the user zooms.
 */
function CorridorLines({
  routes,
  allRoutes,
  selectedRouteId,
  selectedSegmentId,
  hoveredRouteId,
  locale,
  zoom,
  onRouteSelect,
  onRouteHover,
}: {
  routes: CorridorRoute[];
  allRoutes: CorridorRoute[];
  selectedRouteId: string | null;
  selectedSegmentId: string | null;
  hoveredRouteId: string | null;
  locale: SupportedLocale;
  zoom: number;
  onRouteSelect: (routeId: string, segmentId?: string | null) => void;
  onRouteHover: (routeId: string | null) => void;
}) {
  const map = useMap();

  const laneOffsets = useMemo(
    () =>
      new Map(
        allRoutes.map((route) => [route.id, getCorridorOffsetPx(route.id, allRoutes)]),
      ),
    [allRoutes],
  );

  const drawnRoutes = useMemo(() => {
    const project = (coordinate: Coordinate) => map.project(coordinate, zoom);
    const unproject = (point: { x: number; y: number }) => {
      const { lat, lng } = map.unproject(L.point(point.x, point.y), zoom);
      return [lat, lng] as Coordinate;
    };

    return routes.map((route) => {
      const offsetPx = laneOffsets.get(route.id) ?? 0;
      const shift = (coordinates: Coordinate[]) =>
        offsetPathPixels(coordinates, offsetPx, project, unproject);

      return {
        route,
        segments: route.segments.map((segment) => {
          const runs = splitSegmentForDotting(route.id, segment, DOTTED_STRETCHES);

          return {
            segment,
            hitPath: shift(getSegmentRenderCoordinates(segment)),
            solid: runs.solid.map(shift),
            dotted: runs.dotted.map(shift),
          };
        }),
      };
    });
    // `zoom` drives the projection, so it belongs in the dependency list even
    // though it is not referenced outside the closures above.
  }, [laneOffsets, map, routes, zoom]);

  return (
    <>
      {drawnRoutes.map(({ route, segments }) => {
        const isSelected = route.id === selectedRouteId;
        const isHovered = route.id === hoveredRouteId;
        const isDimmed = Boolean(selectedRouteId) && !isSelected;

        return (
          <Pane key={route.id} name={`pane-${route.id}`} style={{ zIndex: 420 }}>
            {segments.map(({ segment, hitPath, solid, dotted }) => {
              const isSelectedSegment = selectedSegmentId === segment.id;
              const color = isSelected
                ? TRANSPORT_MODE_META[segment.mode].color
                : route.routeColor;
              const weight = isSelectedSegment
                ? route.type === "primary"
                  ? 8
                  : 5
                : route.type === "primary"
                  ? 6
                  : 3;
              const opacity = isSelectedSegment
                ? 1
                : isSelected
                  ? 0.9
                  : isDimmed
                    ? 0.18
                    : isHovered
                      ? 0.9
                      : route.type === "primary"
                        ? 0.72
                        : 0.5;
              const className = isSelected || isSelectedSegment
                ? "corridor-line corridor-line--selected"
                : "corridor-line";

              return (
                <Pane
                  key={segment.id}
                  name={`segment-pane-${segment.id}`}
                  style={{ zIndex: isSelectedSegment ? 435 : 420 }}
                >
                  {isSelectedSegment ? (
                    <Polyline
                      positions={hitPath}
                      pathOptions={{
                        pane: "corridor-glow",
                        color,
                        weight: route.type === "primary" ? 11 : 8,
                        opacity: 0.22,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                  ) : null}

                  {/* One wide invisible line carries the hit area, hover and
                      tooltip for the whole segment, so cutting the drawn line
                      into solid and dotted runs cannot fragment them. */}
                  <Polyline
                    positions={hitPath}
                    eventHandlers={{
                      click: () => onRouteSelect(route.id, segment.id),
                      mouseover: () => onRouteHover(route.id),
                      mouseout: () => onRouteHover(null),
                    }}
                    pathOptions={{
                      pane: "corridor-lines",
                      color: "#000000",
                      weight: 22,
                      opacity: 0,
                      lineCap: "round",
                      lineJoin: "round",
                      className: "corridor-hit-line",
                    }}
                  >
                    <Tooltip
                      sticky
                      direction="top"
                      offset={[0, -8]}
                      className="corridor-tooltip"
                    >
                      {getLocalizedText(route.name, locale)}
                    </Tooltip>
                  </Polyline>

                  {solid.map((positions, index) => (
                    <Polyline
                      key={`solid-${index}`}
                      positions={positions}
                      interactive={false}
                      pathOptions={{
                        pane: "corridor-lines",
                        color,
                        weight,
                        opacity,
                        dashArray: route.type === "secondary" ? "10 10" : undefined,
                        lineCap: "round",
                        lineJoin: "round",
                        className,
                      }}
                    />
                  ))}

                  {dotted.map((positions, index) => (
                    <Polyline
                      key={`dotted-${index}`}
                      positions={positions}
                      interactive={false}
                      pathOptions={{
                        pane: "corridor-lines",
                        color,
                        weight,
                        opacity,
                        dashArray: `1 ${Math.round(weight * 1.6)}`,
                        lineCap: "round",
                        lineJoin: "round",
                        className,
                      }}
                    />
                  ))}
                </Pane>
              );
            })}
          </Pane>
        );
      })}
    </>
  );
}

interface CorridorMapCanvasProps {
  routes: CorridorRoute[];
  allRoutes: CorridorRoute[];
  markers: AdminMarker[];
  selectedRouteId: string | null;
  selectedSegmentId: string | null;
  hoveredRouteId: string | null;
  locale: SupportedLocale;
  theme: "dark" | "light";
  showFlowAnimation: boolean;
  resetCount: number;
  /** Bumped when a corridor should be framed; selection alone never re-frames. */
  frameCount: number;
  isMapOnlyMode: boolean;
  onRouteSelect: (routeId: string, segmentId?: string | null) => void;
  onRouteHover: (routeId: string | null) => void;
  onClearSelection: () => void;
  onPortCorridorSelect: (routeId: string) => void;
  t: TFunction;
}

export default function CorridorMapCanvas({
  routes,
  allRoutes,
  markers,
  selectedRouteId,
  selectedSegmentId,
  hoveredRouteId,
  locale,
  theme,
  showFlowAnimation,
  resetCount,
  frameCount,
  isMapOnlyMode,
  onRouteSelect,
  onRouteHover,
  onClearSelection,
  onPortCorridorSelect,
  t,
}: CorridorMapCanvasProps) {
  const activeRoutes = useMemo(
    () => routes.filter((route) => route.status === "active"),
    [routes],
  );
  const safeMarkers = mergeRouteEndpointMarkers(markers ?? [], allRoutes);
  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? null;
  const savedPortMarker =
    safeMarkers.find((marker) => marker.id === "baku-port") ??
    safeMarkers.find((marker) => marker.category === "port") ??
    null;
  const primaryPortMarker: AdminMarker = {
    id: savedPortMarker?.id ?? BAKU_PORT.id,
    name: savedPortMarker?.name ?? BAKU_PORT.name,
    description: savedPortMarker?.description ?? BAKU_PORT.role,
    category: "port",
    icon: savedPortMarker?.icon ?? "anchor",
    coordinates: savedPortMarker?.coordinates ?? BAKU_PORT.coordinates,
    connectedCorridorIds:
      savedPortMarker?.connectedCorridorIds ?? BAKU_PORT.connectedCorridorIds,
  };
  const secondaryMarkers = safeMarkers.filter((marker) => marker.id !== primaryPortMarker.id);
  const primaryPortConnectedRouteIds = Array.from(
    new Set(allRoutes.map((route) => route.id)),
  );
  const highlightedRouteIds = useMemo(
    () => Array.from(new Set([selectedRouteId, hoveredRouteId].filter((id): id is string => Boolean(id)))),
    [selectedRouteId, hoveredRouteId],
  );
  const [zoom, setZoom] = useState(DEFAULT_MAP_VIEW.zoom);
  const showStopLabels = zoom >= LABEL_MIN_ZOOM;

  // Where each visible corridor begins and ends. These are shown as soon as the
  // corridor is, so selecting one immediately reveals the gateways it reaches.
  const visibleRouteTerminalCoordinates = routes.flatMap((route) =>
    collectRouteTerminalStopIds(route)
      .map((stopId) => getTransportStop(stopId)?.coordinates)
      .filter((coordinate): coordinate is Coordinate => Boolean(coordinate)),
  );

  const isRouteTerminalMarker = (marker: AdminMarker) =>
    visibleRouteTerminalCoordinates.some((coordinate) =>
      areCoordinatesNear(marker.coordinates, coordinate),
    );

  // Resolves a marker's tier against the currently-enabled corridors, so an
  // explicit `corridorTiers` override (e.g. Aktau: major on East-West,
  // standard on North-West) reflects whichever corridor the viewer actually
  // has toggled on. Only an explicit override (or the Baku hub) ever grants
  // "major" — there is no heuristic promotion, since that's what buried the
  // map in overlapping always-on pins. Everything else stays zoom-gated.
  const resolveMarkerTier = (marker: AdminMarker) => {
    const activeCorridorIds = getAvailableConnectedRouteIdsForMarker(marker, routes);

    return getMarkerTier(marker, activeCorridorIds);
  };

  // Markers pass two independent gates. Whether a marker is relevant at all comes
  // from the corridor filter, so it appears only once a corridor it serves is
  // enabled. How early it appears comes from its tier (see `resolveMarkerTier`).
  const visibleSecondaryMarkers = secondaryMarkers.filter((marker) => {
    const isOnVisibleRoute =
      getAvailableConnectedRouteIdsForMarker(marker, routes).length > 0;

    if (!isOnVisibleRoute) {
      return false;
    }

    // A corridor's own endpoints skip the zoom tiers entirely.
    if (isRouteTerminalMarker(marker)) {
      return true;
    }

    const activeCorridorIds = getAvailableConnectedRouteIdsForMarker(marker, routes);

    return isMarkerVisibleAtZoom(marker, zoom, activeCorridorIds);
  });

  // Intermediate stop dots are the finest level of detail, so they are keyed to
  // every visible corridor (not just the hovered one) but held back until the
  // deepest zoom tier.
  const routeStopMarkers =
    zoom >= MARKER_MIN_ZOOM.stop
      ? collectRouteStopMarkers(routes, safeMarkers)
      : [];

  return (
    <MapContainer
      center={DEFAULT_MAP_VIEW.center}
      zoom={DEFAULT_MAP_VIEW.zoom}
      minZoom={3}
      maxZoom={14}
      zoomControl={false}
      attributionControl={false}
      className={`corridor-map-canvas corridor-map-canvas--${theme} h-full w-full`}
    >
      <TileLayer
        key={theme}
        url={
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        }
        subdomains={["a", "b", "c", "d"]}
      />

      <ZoomControl position="bottomleft" />
      <ZoomWatcher onZoomChange={setZoom} />
      <MapClickHandler onClearSelection={onClearSelection} />
      <MapResetController resetCount={resetCount} />
      <SelectionController
        route={selectedRoute}
        hasDetailsPanel={!isMapOnlyMode && Boolean(selectedRoute)}
        isMapOnlyMode={isMapOnlyMode}
        frameCount={frameCount}
      />

      <Pane name="corridor-glow" style={{ zIndex: 410 }} />
      <Pane name="corridor-lines" style={{ zIndex: 420 }} />
      <Pane name="corridor-markers" style={{ zIndex: 460 }} />

      <CorridorLines
        routes={routes}
        allRoutes={allRoutes}
        selectedRouteId={selectedRouteId}
        selectedSegmentId={selectedSegmentId}
        hoveredRouteId={hoveredRouteId}
        locale={locale}
        zoom={zoom}
        onRouteSelect={onRouteSelect}
        onRouteHover={onRouteHover}
      />
      {showFlowAnimation ? (
        <VehicleLayer routes={activeRoutes} allRoutes={allRoutes} />
      ) : null}

      <Marker
        key={primaryPortMarker.id}
        position={primaryPortMarker.coordinates}
        icon={createMarkerIcon(primaryPortMarker, theme, { size: 43, pulse: true })}
      >
        <Tooltip
          permanent
          direction="top"
          offset={[0, -24]}
          className="port-marker-tooltip"
        >
          {getLocalizedText(primaryPortMarker.name, locale)}
        </Tooltip>
        <Popup className="baku-port-popup" offset={[0, -12]}>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                {getLocalizedText(primaryPortMarker.name, locale)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {getLocalizedText(primaryPortMarker.description, locale)}
              </p>
            </div>

            {primaryPortConnectedRouteIds.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t("port.quickLinks")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {primaryPortConnectedRouteIds.map((routeId) => {
                    const route = allRoutes.find((corridor) => corridor.id === routeId);

                    if (!route) {
                      return null;
                    }

                    return (
                      <button
                        key={routeId}
                        type="button"
                        onClick={() => onPortCorridorSelect(routeId)}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                      >
                        {getLocalizedText(route.name, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Popup>
      </Marker>

      {visibleSecondaryMarkers.map((marker) => {
        const connectedCorridorIds = getAvailableConnectedRouteIdsForMarker(marker, allRoutes);
        const isOnHighlightedRoute = connectedCorridorIds.some((routeId) =>
          highlightedRouteIds.includes(routeId),
        );
        const tier = resolveMarkerTier(marker);

        return (
            <Marker
              key={marker.id}
              position={marker.coordinates}
              icon={createMarkerIcon(marker, theme, { size: tier === "major" ? 36 : 22 })}
            >
            {isOnHighlightedRoute && showStopLabels ? (
              <Tooltip
                permanent
                direction="right"
                offset={[16, 0]}
                className="route-stop-tooltip"
              >
                {getLocalizedText(marker.name, locale)}
              </Tooltip>
            ) : null}
            <Popup className="baku-port-popup" offset={[0, -12]}>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {getLocalizedText(marker.name, locale)}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {getLocalizedText(marker.description, locale)}
                  </p>
                </div>

                {connectedCorridorIds.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {t("port.quickLinks")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {connectedCorridorIds.map((routeId) => {
                        const route = allRoutes.find((corridor) => corridor.id === routeId);

                        if (!route) {
                          return null;
                        }

                        return (
                          <button
                            key={routeId}
                            type="button"
                            onClick={() => onPortCorridorSelect(routeId)}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                          >
                            {getLocalizedText(route.name, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {routeStopMarkers.map((stop) => {
        const isDimmed = Boolean(selectedRouteId) && !stop.routeIds.includes(selectedRouteId as string);
        const color = (selectedRouteId && stop.colorByRoute.get(selectedRouteId)) ?? stop.defaultColor;

        return (
          <Marker
            key={stop.stopId}
            position={stop.coordinate}
            icon={createStopMarkerIcon(color)}
            pane="corridor-markers"
            interactive={false}
            opacity={isDimmed ? 0.35 : 1}
          >
            {showStopLabels ? (
              <Tooltip
                permanent
                direction="right"
                offset={[8, 0]}
                className="route-stop-tooltip"
              >
                {getLocalizedText(stop.name, locale)}
              </Tooltip>
            ) : null}
          </Marker>
        );
      })}
    </MapContainer>
  );
}
