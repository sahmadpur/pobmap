"use client";

import { useEffect, useState } from "react";
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
import { getMarkerIconSvg } from "@/data/marker-icons";
import { getTransportStop } from "@/data/transport-stops";
import {
  flattenRouteCoordinates,
  getSegmentRenderCoordinates,
  interpolateAlongPath,
} from "@/lib/map-utils";
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

const FLOW_ARROW_DIMENSIONS: Record<
  TransportMode,
  { width: number; height: number; anchorX: number; anchorY: number }
> = {
  rail: { width: 16, height: 16, anchorX: 8, anchorY: 8 },
  ship: { width: 18, height: 18, anchorX: 9, anchorY: 9 },
  road: { width: 14, height: 14, anchorX: 7, anchorY: 7 },
};

function createFlowIcon(mode: TransportMode) {
  const dimensions = FLOW_ARROW_DIMENSIONS[mode];

  return L.divIcon({
    className: "flow-icon-wrapper",
    html: `
      <div
        class="flow-icon flow-icon--${mode}"
        style="--flow-width:${dimensions.width}px; --flow-height:${dimensions.height}px;"
      >
        <span class="flow-icon__shadow" aria-hidden="true"></span>
        <span class="flow-icon__dot" aria-hidden="true"></span>
      </div>
    `,
    iconSize: [dimensions.width, dimensions.height],
    iconAnchor: [dimensions.anchorX, dimensions.anchorY],
  });
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

function SelectionController({
  route,
  hasDetailsPanel,
  isMapOnlyMode,
}: {
  route: CorridorRoute | null;
  hasDetailsPanel: boolean;
  isMapOnlyMode: boolean;
}) {
  const map = useMap();
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleResize() {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
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

    const padding = getSelectionPadding(viewport.width, viewport.height, {
      hasDetailsPanel,
      isMapOnlyMode,
    });

    map.fitBounds(coordinates, {
      animate: true,
      duration: 1,
      paddingTopLeft: padding.paddingTopLeft,
      paddingBottomRight: padding.paddingBottomRight,
    });
  }, [hasDetailsPanel, isMapOnlyMode, map, route, viewport.height, viewport.width]);

  return null;
}

function FlowMarkers({ routes }: { routes: CorridorRoute[] }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFrame(performance.now());
    }, 90);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      {routes.flatMap((route) =>
        route.segments.flatMap((segment, segmentIndex) => {
          const renderCoordinates = getSegmentRenderCoordinates(segment);

          if (renderCoordinates.length < 2) {
            return [];
          }

          const progress =
            ((frame / 1000) * route.animationSpeed + segmentIndex * 0.33) % 1;
          const coordinate = interpolateAlongPath(renderCoordinates, progress);

          return (
            <Marker
              key={segment.id}
              position={coordinate}
              icon={createFlowIcon(segment.mode)}
              interactive={false}
              keyboard={false}
            />
          );
        }),
      )}
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
  isMapOnlyMode,
  onRouteSelect,
  onRouteHover,
  onClearSelection,
  onPortCorridorSelect,
  t,
}: CorridorMapCanvasProps) {
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
  const visibleSecondaryMarkers = secondaryMarkers;

  return (
    <MapContainer
      center={DEFAULT_MAP_VIEW.center}
      zoom={DEFAULT_MAP_VIEW.zoom}
      minZoom={3}
      maxZoom={7}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer
        url={
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        }
        subdomains={["a", "b", "c", "d"]}
      />

      <ZoomControl position="bottomright" />
      <MapClickHandler onClearSelection={onClearSelection} />
      <MapResetController resetCount={resetCount} />
      <SelectionController
        route={selectedRoute}
        hasDetailsPanel={!isMapOnlyMode && Boolean(selectedRoute)}
        isMapOnlyMode={isMapOnlyMode}
      />

      <Pane name="corridor-glow" style={{ zIndex: 410 }} />
      <Pane name="corridor-lines" style={{ zIndex: 420 }} />
      <Pane name="corridor-markers" style={{ zIndex: 460 }} />

      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const isHovered = route.id === hoveredRouteId;
        const isDimmed = Boolean(selectedRouteId) && !isSelected;

        return (
          <Pane key={route.id} name={`pane-${route.id}`} style={{ zIndex: 420 }}>
            {route.segments.map((segment) => (
              <Pane
                key={segment.id}
                name={`segment-pane-${segment.id}`}
                style={{ zIndex: selectedSegmentId === segment.id ? 435 : 420 }}
              >
                {selectedSegmentId === segment.id ? (
                  <Polyline
                    positions={getSegmentRenderCoordinates(segment)}
                    pathOptions={{
                      pane: "corridor-glow",
                      color: isSelected
                        ? TRANSPORT_MODE_META[segment.mode].color
                        : route.routeColor,
                      weight: route.type === "primary" ? 11 : 8,
                      opacity: 0.22,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                ) : null}

                <Polyline
                  positions={getSegmentRenderCoordinates(segment)}
                  eventHandlers={{
                    click: () => onRouteSelect(route.id, segment.id),
                    mouseover: () => onRouteHover(route.id),
                    mouseout: () => onRouteHover(null),
                  }}
                  pathOptions={{
                    pane: "corridor-lines",
                    color: isSelected
                      ? TRANSPORT_MODE_META[segment.mode].color
                      : route.routeColor,
                    weight:
                      selectedSegmentId === segment.id
                        ? route.type === "primary"
                          ? 8
                          : 5
                        : route.type === "primary"
                          ? 6
                          : 3,
                    opacity: selectedSegmentId === segment.id
                      ? 1
                      : isSelected
                        ? 0.9
                        : isDimmed
                          ? 0.18
                          : isHovered
                            ? 0.9
                            : route.type === "primary"
                              ? 0.72
                              : 0.5,
                    dashArray: route.type === "secondary" ? "10 10" : undefined,
                    lineCap: "round",
                    lineJoin: "round",
                    className:
                      isSelected || selectedSegmentId === segment.id
                        ? "corridor-line corridor-line--selected"
                        : "corridor-line",
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
              </Pane>
            ))}
          </Pane>
        );
      })}

      {showFlowAnimation ? (
        <FlowMarkers
          routes={
            selectedRoute && selectedRoute.status === "active"
              ? [selectedRoute]
              : []
          }
        />
      ) : null}

      <Marker
        key={primaryPortMarker.id}
        position={primaryPortMarker.coordinates}
        icon={createMarkerIcon(primaryPortMarker, theme, { size: 43, pulse: true })}
      >
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

        return (
            <Marker
              key={marker.id}
              position={marker.coordinates}
              icon={createMarkerIcon(marker, theme)}
            >
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
    </MapContainer>
  );
}
