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
import { flattenRouteCoordinates, interpolateAlongPath } from "@/lib/map-utils";
import type { CorridorRoute, SupportedLocale, TransportMode } from "@/types/map";

const portIcon = L.divIcon({
  className: "baku-port-icon-wrapper",
  html: `
    <div class="baku-port-icon">
      <span class="baku-port-icon__ring"></span>
      <span class="baku-port-icon__core">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2v8.2a3.8 3.8 0 1 0 0 7.6a3.8 3.8 0 0 0 0-7.6V2Zm-6.7 8.2H2v2.2h3.3a6.7 6.7 0 0 0 5.6 5.2V21h2.2v-3.4a6.7 6.7 0 0 0 5.6-5.2H22v-2.2h-3.3a6.7 6.7 0 0 0-13.4 0Z" />
        </svg>
      </span>
    </div>
  `,
  iconSize: [54, 54],
  iconAnchor: [27, 27],
  popupAnchor: [0, -24],
});

function createFlowIcon(mode: TransportMode, color: string) {
  const iconMarkup =
    mode === "rail"
      ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10a3 3 0 0 1 3 3v6a4 4 0 0 1-4 4l1.4 2H15l-1.2-1.7a1 1 0 0 0-.8-.3h-2a1 1 0 0 0-.8.4L9 19H6.6L8 17a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v2h12V7a1 1 0 0 0-1-1H7Zm0 5v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H7Zm2.25 1.2a1.05 1.05 0 1 0 0 2.1a1.05 1.05 0 0 0 0-2.1Zm5.5 0a1.05 1.05 0 1 0 0 2.1a1.05 1.05 0 0 0 0-2.1Z" fill="currentColor"/></svg>`
      : mode === "ship"
        ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l3.8 3v4.1l2.7 1.6c.9.5 1.5 1.5 1.5 2.5v1.8c-.8.5-1.5.8-2.2.8c-1 0-1.6-.5-2.1-.9c-.5.4-1.2.9-2.3.9s-1.8-.5-2.3-.9c-.5.4-1.1.9-2.1.9c-.7 0-1.4-.3-2.2-.8V14.2c0-1 .6-2 1.5-2.5l2.7-1.6V6L12 3Zm-1 5.2v2.5h2V8.2l-1-.8l-1 .8Zm-3 7.4c.5.2.8.3 1 .3c.4 0 .7-.2 1.1-.5l.9-.7l.9.7c.4.3.7.5 1.1.5s.7-.2 1.1-.5l.9-.7l.9.7c.4.3.7.5 1.1.5c.2 0 .5-.1 1-.3v1.4c0 1.7-2.9 3-6 3s-6-1.3-6-3v-1.4Z" fill="currentColor"/></svg>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11a2 2 0 0 1 2 2v1h2.6c.5 0 .9.2 1.2.5l1.7 1.8c.3.3.5.8.5 1.2V16h-1.2a2.8 2.8 0 0 1-5.6 0H10.8a2.8 2.8 0 0 1-5.6 0H3v-2.2V9a2 2 0 0 1 2-2Zm2.3 8a1.3 1.3 0 1 0 0 2.6a1.3 1.3 0 0 0 0-2.6Zm12 0a1.3 1.3 0 1 0 0 2.6a1.3 1.3 0 0 0 0-2.6ZM16 11.5v2.2h4V13l-1.4-1.5H16Z" fill="currentColor"/></svg>`;

  return L.divIcon({
    className: "flow-icon-wrapper",
    html: `
      <div class="flow-icon" style="--flow-color:${color}">
        <span class="flow-icon__glyph flow-icon__glyph--svg" aria-hidden="true">${iconMarkup}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
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

function SelectionController({ route }: { route: CorridorRoute | null }) {
  const map = useMap();

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

    map.fitBounds(coordinates, {
      animate: true,
      duration: 1,
      padding: [64, 64],
    });
  }, [map, route]);

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
          if (segment.coordinates.length < 2) {
            return [];
          }

          const progress =
            ((frame / 1000) * route.animationSpeed + segmentIndex * 0.33) % 1;

          return (
            <Marker
              key={segment.id}
              position={interpolateAlongPath(segment.coordinates, progress)}
              icon={createFlowIcon(segment.mode, TRANSPORT_MODE_META[segment.mode].color)}
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
  selectedRouteId: string | null;
  selectedSegmentId: string | null;
  hoveredRouteId: string | null;
  locale: SupportedLocale;
  theme: "dark" | "light";
  showFlowAnimation: boolean;
  resetCount: number;
  onRouteSelect: (routeId: string, segmentId?: string | null) => void;
  onRouteHover: (routeId: string | null) => void;
  onClearSelection: () => void;
  onPortCorridorSelect: (routeId: string) => void;
  t: TFunction;
}

export default function CorridorMapCanvas({
  routes,
  selectedRouteId,
  selectedSegmentId,
  hoveredRouteId,
  locale,
  theme,
  showFlowAnimation,
  resetCount,
  onRouteSelect,
  onRouteHover,
  onClearSelection,
  onPortCorridorSelect,
  t,
}: CorridorMapCanvasProps) {
  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? null;

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
      <SelectionController route={selectedRoute} />

      <Pane name="corridor-glow" style={{ zIndex: 410 }} />
      <Pane name="corridor-lines" style={{ zIndex: 420 }} />
      <Pane name="corridor-markers" style={{ zIndex: 460 }} />

      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const isHovered = route.id === hoveredRouteId;
        const isDimmed = Boolean(selectedRouteId) && !isSelected;

        return (
          <Pane key={route.id} name={`pane-${route.id}`} style={{ zIndex: 420 }}>
            {isSelected ? (
              <Polyline
                positions={flattenRouteCoordinates(route)}
                pathOptions={{
                  pane: "corridor-glow",
                  color: "#F8FAFC",
                  weight: route.type === "primary" ? 12 : 7,
                  opacity: 0.34,
                  lineCap: "round",
                  lineJoin: "round",
                  className: "corridor-glow-line",
                }}
              />
            ) : null}

            {route.segments.map((segment) => (
              <Pane
                key={segment.id}
                name={`segment-pane-${segment.id}`}
                style={{ zIndex: selectedSegmentId === segment.id ? 435 : 420 }}
              >
                {selectedSegmentId === segment.id ? (
                  <Polyline
                    positions={segment.coordinates}
                    pathOptions={{
                      pane: "corridor-glow",
                      color: TRANSPORT_MODE_META[segment.mode].color,
                      weight: route.type === "primary" ? 11 : 8,
                      opacity: 0.22,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                ) : null}

                <Polyline
                  positions={segment.coordinates}
                  eventHandlers={{
                    click: () => onRouteSelect(route.id, segment.id),
                    mouseover: () => onRouteHover(route.id),
                    mouseout: () => onRouteHover(null),
                  }}
                  pathOptions={{
                    pane: "corridor-lines",
                    color: TRANSPORT_MODE_META[segment.mode].color,
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
          routes={routes.filter((route) => route.status === "active")}
        />
      ) : null}

      <Marker position={BAKU_PORT.coordinates} icon={portIcon}>
        <Popup className="baku-port-popup" offset={[0, -12]}>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                {getLocalizedText(BAKU_PORT.name, locale)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {getLocalizedText(BAKU_PORT.role, locale)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {t("port.quickLinks")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BAKU_PORT.connectedCorridorIds.map((routeId) => {
                  const route = routes.find((corridor) => corridor.id === routeId);

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
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
