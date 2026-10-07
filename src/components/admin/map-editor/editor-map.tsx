"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Pane,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { DEFAULT_MAP_VIEW, TRANSPORT_MODE_META } from "@/data/corridors";
import { getMarkerIdForStop, type TransportStop } from "@/data/transport-stops";
import { getSegmentRenderCoordinates } from "@/lib/map-utils";
import { nearestInsertionIndex, type EditorVertex } from "@/lib/route-editor-model";
import type { Coordinate, CorridorRoute, SegmentLineStyle } from "@/types/map";

export type EditorTool = "select" | "draw" | "city";

/** A one-shot camera request; `key` changes whenever a new frame is wanted. */
export interface FitRequest {
  key: number;
  coordinates: Coordinate[];
}

export interface EditorMapProps {
  tileUrl: string;
  route: CorridorRoute | null;
  otherRoutes: CorridorRoute[];
  showOtherRoutes: boolean;
  stops: TransportStop[];
  showCities: boolean;
  tool: EditorTool;
  selectedSegmentId: string | null;
  /** Vertices of the selected leg; empty when nothing is selected. */
  vertices: EditorVertex[];
  selectedLineStyle: SegmentLineStyle;
  activeVertexIndex: number | null;
  /** Points of the leg being drawn. */
  draft: EditorVertex[];
  /** Position of a city being created, shown as a draggable pin. */
  pendingCity: Coordinate | null;
  fitRequest: FitRequest | null;
  onSelectSegment: (segmentId: string | null) => void;
  onVerticesChange: (vertices: EditorVertex[]) => void;
  onActiveVertexChange: (index: number | null) => void;
  onDraftChange: (vertices: EditorVertex[]) => void;
  onDraftFinish: () => void;
  onCityPlace: (coordinate: Coordinate) => void;
  onStopEdit: (stop: TransportStop) => void;
  onPendingCityMove: (coordinate: Coordinate) => void;
}

/** How close, in screen pixels, a point has to be to a city to snap to it. */
const SNAP_PX = 14;
/** Zoom from which every city carries a permanent label. */
const CITY_LABEL_ZOOM = 6;
export const EDITOR_MIN_ZOOM = 3;
export const EDITOR_MAX_ZOOM = 10;

const iconCache = new Map<string, L.DivIcon>();

function handleIcon(classes: string, size: number): L.DivIcon {
  const key = `${classes}|${size}`;
  const cached = iconCache.get(key);

  if (cached) {
    return cached;
  }

  const icon = L.divIcon({
    className: "rme-handle-wrapper",
    html: `<span class="${classes}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  iconCache.set(key, icon);

  return icon;
}

function vertexIcon(vertex: EditorVertex, isEnd: boolean): L.DivIcon {
  const classes = [
    "rme-handle",
    vertex.stopId ? "rme-handle--stop" : "",
    isEnd ? "rme-handle--end" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return handleIcon(classes, isEnd ? 16 : 14);
}

const MIDPOINT_ICON = handleIcon("rme-midpoint", 10);
const PENDING_CITY_ICON = L.divIcon({
  className: "rme-handle-wrapper",
  html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#f6b53d;border:2px solid #1a1206;box-shadow:0 3px 8px rgba(0,0,0,.35);"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function toCoordinate(latlng: L.LatLng): Coordinate {
  return [latlng.lat, latlng.lng];
}

function DoubleClickZoomSwitch({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (enabled) {
      map.doubleClickZoom.enable();
    } else {
      map.doubleClickZoom.disable();
    }
  }, [enabled, map]);

  return null;
}

function FitController({ request }: { request: FitRequest | null }) {
  const map = useMap();
  const lastKey = useRef<number | null>(null);

  useEffect(() => {
    if (!request || request.key === lastKey.current) {
      return;
    }

    lastKey.current = request.key;

    // A map torn down mid-animation (dev double-mount, hot reload) throws from
    // inside Leaflet's frame callback; skip it rather than fit a dead map.
    if (request.coordinates.length === 0 || !map.getContainer().isConnected) {
      return;
    }

    if (request.coordinates.length === 1) {
      map.setView(request.coordinates[0], Math.max(map.getZoom(), 6), { animate: true });
      return;
    }

    map.fitBounds(request.coordinates, {
      padding: [48, 48],
      maxZoom: 9,
      animate: true,
    });
  }, [map, request]);

  return null;
}

/** Custom cities, and markers including those drawn as a built-in city's dot. */
function isEditableStop(stop: TransportStop): boolean {
  return stop.source === "custom" || Boolean(getMarkerIdForStop(stop.id));
}

/** Degrees of slack around the viewport so dots do not pop at the edge. */
const VIEW_PADDING = 0.5;
/** Below this zoom every city dot is drawn; above it only the ones in view. */
const CULL_ZOOM = 5;

/**
 * City dots and labels. Memoized and fed only stable props so cursor moves and
 * handle drags never touch its several hundred markers, and culled to the
 * viewport once zoomed in because Leaflet keeps every permanent tooltip in
 * the DOM whether or not it is on screen.
 */
const CityLayer = memo(function CityLayer({
  stops,
  bounds,
  zoom,
  routeStopIds,
  snapTargetId,
  tool,
  onCityClick,
  onCityDoubleClick,
}: {
  stops: TransportStop[];
  bounds: L.LatLngBounds;
  zoom: number;
  routeStopIds: Set<string>;
  snapTargetId: string | null;
  tool: EditorTool;
  onCityClick: (stop: TransportStop, latlng: L.LatLng) => void;
  onCityDoubleClick: () => void;
}) {
  const showLabels = zoom >= CITY_LABEL_ZOOM;
  const visible =
    zoom < CULL_ZOOM
      ? stops
      : stops.filter((stop) => bounds.pad(VIEW_PADDING).contains(stop.coordinates));

  return (
    <>
      {visible.map((stop) => {
        const isCustom = stop.source === "custom";
        const isMarker = stop.source === "marker";
        // A built-in city with a marker on it: ringed pink, opens the marker.
        const carriesMarker = !isCustom && !isMarker && isEditableStop(stop);
        const isOnRoute = routeStopIds.has(stop.id);
        const isSnapTarget = snapTargetId === stop.id;

        return (
          <CircleMarker
            key={stop.id}
            center={stop.coordinates}
            radius={isSnapTarget ? 8 : isCustom || isMarker ? 5.5 : 4.5}
            eventHandlers={{
              click: (event) => onCityClick(stop, event.latlng),
              // Double-clicking the last city is the natural way to finish a
              // leg; the circle swallows the map's dblclick, so relay it.
              dblclick: onCityDoubleClick,
            }}
            pathOptions={{
              pane: "rme-cities",
              color: isCustom ? "#b06f08" : isMarker || carriesMarker ? "#9d174d" : "#1e293b",
              weight: isSnapTarget ? 3 : isMarker || carriesMarker ? 2 : 1.5,
              fillColor: isCustom
                ? "#f6b53d"
                : isMarker
                  ? "#f9a8d4"
                  : isOnRoute
                    ? "#0ea5e9"
                    : "#ffffff",
              fillOpacity: stop.editorVisible === false ? 0.35 : 1,
              opacity: stop.editorVisible === false ? 0.5 : 1,
              // `interactive` is fixed at creation, so it stays on; the
              // handler decides what a click means, and in select mode the
              // click bubbles on so the map can clear the active point.
              bubblingMouseEvents: tool === "select",
            }}
          >
            {/* Leaflet tooltips take their options once, so a change of
                `permanent` needs a fresh instance. */}
            <Tooltip
              key={showLabels ? "label" : "hover"}
              permanent={showLabels}
              direction="right"
              offset={[6, 0]}
              className={`rme-city-tooltip ${
                isCustom ? "rme-city-tooltip--custom" : isMarker ? "rme-city-tooltip--marker" : ""
              }`}
            >
              {stop.name.en}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
});

function EditorLayers({
  route,
  otherRoutes,
  showOtherRoutes,
  stops,
  showCities,
  tool,
  selectedSegmentId,
  vertices,
  selectedLineStyle,
  activeVertexIndex,
  draft,
  pendingCity,
  onSelectSegment,
  onVerticesChange,
  onActiveVertexChange,
  onDraftChange,
  onDraftFinish,
  onCityPlace,
  onStopEdit,
  onPendingCityMove,
}: Omit<EditorMapProps, "tileUrl" | "fitRequest">) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  const [bounds, setBounds] = useState(() => map.getBounds());
  const [cursor, setCursor] = useState<Coordinate | null>(null);
  // Vertices while a handle is being dragged; the line follows these and the
  // committed vertices are only replaced on drop.
  const [liveVertices, setLiveVertices] = useState<EditorVertex[] | null>(null);
  const [snapTarget, setSnapTarget] = useState<TransportStop | null>(null);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  const shownVertices = liveVertices ?? vertices;
  const routeStopIds = useMemo(
    () =>
      new Set(route?.segments.flatMap((segment) => segment.stopIds ?? []) ?? []),
    [route],
  );

  function snapToStop(latlng: L.LatLng): TransportStop | null {
    const point = map.latLngToContainerPoint(latlng);
    let best: TransportStop | null = null;
    let bestDistance = SNAP_PX;

    for (const stop of stops) {
      const stopPoint = map.latLngToContainerPoint(stop.coordinates);
      const distance = Math.hypot(stopPoint.x - point.x, stopPoint.y - point.y);

      if (distance < bestDistance) {
        bestDistance = distance;
        best = stop;
      }
    }

    return best;
  }

  function addDraftPoint(latlng: L.LatLng, forcedStop?: TransportStop) {
    const stop = forcedStop ?? snapToStop(latlng);

    if (stop) {
      onDraftChange([...draft, { coordinate: stop.coordinates, stopId: stop.id }]);
      return;
    }

    // The first point has to be a city; a free click before that is ignored
    // and the sidebar explains why.
    if (draft.length === 0) {
      return;
    }

    onDraftChange([...draft, { coordinate: toCoordinate(latlng), stopId: null }]);
  }

  // The first fit can finish before these handlers are attached, so the zoom
  // is also read back on every move.
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    mousemove: (event) => {
      setCursor(toCoordinate(event.latlng));

      if (tool === "draw") {
        setSnapTarget(snapToStop(event.latlng));
      }
    },
    mouseout: () => setCursor(null),
    click: (event) => {
      if (tool === "draw") {
        addDraftPoint(event.latlng);
        return;
      }

      if (tool === "city") {
        const stop = snapToStop(event.latlng);

        if (stop && isEditableStop(stop)) {
          onStopEdit(stop);
          return;
        }

        onCityPlace(toCoordinate(event.latlng));
        return;
      }

      onActiveVertexChange(null);
    },
    dblclick: () => {
      if (tool === "draw") {
        onDraftFinish();
      }
    },
  });

  useEffect(() => {
    if (tool !== "draw") {
      setSnapTarget(null);
    }
  }, [tool]);

  // Kept in a ref so the memoized city layer never re-renders because of it.
  const cityClickRef = useRef<(stop: TransportStop, latlng: L.LatLng) => void>(() => undefined);
  cityClickRef.current = (stop, latlng) => {
    if (tool === "draw") {
      addDraftPoint(latlng, stop);
    } else if (tool === "city" && isEditableStop(stop)) {
      onStopEdit(stop);
    }
  };
  const handleCityClick = useMemo(
    () => (stop: TransportStop, latlng: L.LatLng) => cityClickRef.current(stop, latlng),
    [],
  );
  const cityDoubleClickRef = useRef<() => void>(() => undefined);
  cityDoubleClickRef.current = () => {
    if (tool === "draw") {
      onDraftFinish();
    }
  };
  const handleCityDoubleClick = useMemo(() => () => cityDoubleClickRef.current(), []);

  // Midpoints are computed in screen space so they sit visually halfway even
  // where Mercator stretches the line.
  const midpoints = useMemo(() => {
    if (tool !== "select" || shownVertices.length < 2 || liveVertices) {
      return [];
    }

    return shownVertices.slice(1).map((vertex, index) => {
      const a = map.latLngToContainerPoint(shownVertices[index].coordinate);
      const b = map.latLngToContainerPoint(vertex.coordinate);
      const middle = map.containerPointToLatLng(L.point((a.x + b.x) / 2, (a.y + b.y) / 2));

      return { index: index + 1, coordinate: toCoordinate(middle) };
    });
    // `zoom` re-projects the midpoints; it is read through `map` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveVertices, map, shownVertices, tool, zoom]);

  function insertVertexOnLine(latlng: L.LatLng) {
    const points = vertices.map((vertex) => {
      const point = map.latLngToContainerPoint(vertex.coordinate);
      return [point.x, point.y] as [number, number];
    });
    const click = map.latLngToContainerPoint(latlng);
    const index = nearestInsertionIndex(points, [click.x, click.y]);
    const next = [
      ...vertices.slice(0, index),
      { coordinate: toCoordinate(latlng), stopId: null },
      ...vertices.slice(index),
    ];

    onVerticesChange(next);
    onActiveVertexChange(index);
  }

  const draftCoordinates = draft.map((vertex) => vertex.coordinate);
  const rubberBand =
    tool === "draw" && draft.length > 0 && cursor
      ? [draft[draft.length - 1].coordinate, snapTarget?.coordinates ?? cursor]
      : null;

  return (
    <>
      <Pane name="rme-ghost" style={{ zIndex: 400 }} />
      <Pane name="rme-legs" style={{ zIndex: 410 }} />
      <Pane name="rme-selected" style={{ zIndex: 420 }} />
      <Pane name="rme-cities" style={{ zIndex: 430 }} />
      <Pane name="rme-handles" style={{ zIndex: 640 }} />

      {showOtherRoutes
        ? otherRoutes.map((other) =>
            other.segments.map((segment) => (
              <Polyline
                key={`${other.id}-${segment.id}`}
                positions={getSegmentRenderCoordinates(segment)}
                interactive={false}
                pathOptions={{
                  pane: "rme-ghost",
                  color: other.routeColor,
                  weight: 2,
                  opacity: 0.28,
                  dashArray: segment.lineStyle === "dotted" ? "1 6" : undefined,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )),
          )
        : null}

      {route?.segments
        .filter((segment) => segment.id !== selectedSegmentId)
        .map((segment) => {
          const isHovered = hoveredSegmentId === segment.id;

          return (
            <Polyline
              key={segment.id}
              positions={getSegmentRenderCoordinates(segment)}
              eventHandlers={{
                click: () => {
                  if (tool === "select") {
                    onSelectSegment(segment.id);
                  }
                },
                mouseover: () => setHoveredSegmentId(segment.id),
                mouseout: () => setHoveredSegmentId(null),
              }}
              pathOptions={{
                pane: "rme-legs",
                color: TRANSPORT_MODE_META[segment.mode].color,
                weight: isHovered ? 7 : 5,
                opacity: isHovered ? 1 : 0.8,
                dashArray: segment.lineStyle === "dotted" ? "1 9" : undefined,
                lineCap: "round",
                lineJoin: "round",
                // Only swallow the click when it means "select this leg";
                // while drawing, a click on a leg is a click on the map.
                bubblingMouseEvents: tool !== "select",
              }}
            >
              <Tooltip sticky direction="top" offset={[0, -8]} className="rme-leg-tooltip">
                {segment.from.en} → {segment.to.en} · {segment.mode}
              </Tooltip>
            </Polyline>
          );
        })}

      {showCities ? (
        <CityLayer
          stops={stops}
          bounds={bounds}
          zoom={zoom}
          routeStopIds={routeStopIds}
          snapTargetId={snapTarget?.id ?? null}
          tool={tool}
          onCityClick={handleCityClick}
          onCityDoubleClick={handleCityDoubleClick}
        />
      ) : null}

      {shownVertices.length >= 2 ? (
        <Polyline
          positions={shownVertices.map((vertex) => vertex.coordinate)}
          eventHandlers={{
            click: (event) => {
              if (tool === "select" && !liveVertices) {
                insertVertexOnLine(event.latlng);
              }
            },
          }}
          pathOptions={{
            pane: "rme-selected",
            color: "#f6b53d",
            weight: 5,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
            dashArray: selectedLineStyle === "dotted" ? "1 9" : undefined,
            bubblingMouseEvents: tool !== "select",
          }}
        />
      ) : null}

      {tool === "select" && activeVertexIndex !== null && shownVertices[activeVertexIndex] ? (
        <CircleMarker
          center={shownVertices[activeVertexIndex].coordinate}
          radius={12}
          interactive={false}
          pathOptions={{
            pane: "rme-selected",
            color: "#f6b53d",
            weight: 3,
            opacity: 0.9,
            fill: false,
          }}
        />
      ) : null}

      {tool === "select"
        ? midpoints.map((midpoint) => (
            <Marker
              key={`mid-${midpoint.index}`}
              position={midpoint.coordinate}
              icon={MIDPOINT_ICON}
              pane="rme-handles"
              keyboard={false}
              eventHandlers={{
                click: () => {
                  const next = [
                    ...vertices.slice(0, midpoint.index),
                    { coordinate: midpoint.coordinate, stopId: null },
                    ...vertices.slice(midpoint.index),
                  ];

                  onVerticesChange(next);
                  onActiveVertexChange(midpoint.index);
                },
              }}
            />
          ))
        : null}

      {tool === "select"
        ? vertices.map((vertex, index) => {
            const isEnd = index === 0 || index === vertices.length - 1;

            return (
              <Marker
                key={`vertex-${index}-${vertices.length}`}
                position={vertex.coordinate}
                // The icon must not change while a handle is being dragged:
                // Leaflet re-initialises the marker's drag handler on
                // setIcon, which ends the drag. Selection is drawn as a
                // separate ring below instead of as an icon class.
                icon={vertexIcon(vertex, isEnd)}
                pane="rme-handles"
                draggable
                keyboard={false}
                eventHandlers={{
                  click: () => onActiveVertexChange(index),
                  dblclick: () => {
                    if (!isEnd) {
                      onVerticesChange(vertices.filter((_, i) => i !== index));
                      onActiveVertexChange(null);
                    }
                  },
                  dragstart: () => {
                    setLiveVertices(vertices);
                  },
                  drag: (event) => {
                    const latlng = (event.target as L.Marker).getLatLng();
                    const coordinate = toCoordinate(latlng);

                    setSnapTarget(snapToStop(latlng));
                    setLiveVertices((current) =>
                      (current ?? vertices).map((item, i) =>
                        i === index ? { ...item, coordinate } : item,
                      ),
                    );
                  },
                  dragend: (event) => {
                    const latlng = (event.target as L.Marker).getLatLng();
                    const stop = snapToStop(latlng);
                    const next = vertices.map((item, i) =>
                      i === index
                        ? stop
                          ? { coordinate: stop.coordinates, stopId: stop.id }
                          : { coordinate: toCoordinate(latlng), stopId: null }
                        : item,
                    );

                    setLiveVertices(null);
                    setSnapTarget(null);
                    onVerticesChange(next);
                    onActiveVertexChange(index);
                  },
                }}
              >
                {vertex.stopId ? (
                  <Tooltip direction="top" offset={[0, -8]} className="rme-leg-tooltip">
                    {stops.find((stop) => stop.id === vertex.stopId)?.name.en ?? vertex.stopId}
                  </Tooltip>
                ) : null}
              </Marker>
            );
          })
        : null}

      {draftCoordinates.length >= 2 ? (
        <Polyline
          positions={draftCoordinates}
          interactive={false}
          pathOptions={{
            pane: "rme-selected",
            color: "#f6b53d",
            weight: 5,
            dashArray: "10 8",
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ) : null}

      {rubberBand ? (
        <Polyline
          positions={rubberBand}
          interactive={false}
          pathOptions={{
            pane: "rme-selected",
            color: "#f6b53d",
            weight: 3,
            dashArray: "2 8",
            opacity: 0.8,
          }}
        />
      ) : null}

      {tool === "draw"
        ? draft.map((vertex, index) => (
            <Marker
              key={`draft-${index}`}
              position={vertex.coordinate}
              icon={vertexIcon(vertex, index === 0)}
              pane="rme-handles"
              interactive={false}
              keyboard={false}
            />
          ))
        : null}

      {snapTarget ? (
        <CircleMarker
          center={snapTarget.coordinates}
          radius={12}
          interactive={false}
          pathOptions={{
            pane: "rme-handles",
            color: "#f6b53d",
            weight: 2,
            fill: false,
            dashArray: "3 3",
          }}
        />
      ) : null}

      {pendingCity ? (
        <Marker
          position={pendingCity}
          icon={PENDING_CITY_ICON}
          pane="rme-handles"
          draggable
          keyboard={false}
          eventHandlers={{
            dragend: (event) =>
              onPendingCityMove(toCoordinate((event.target as L.Marker).getLatLng())),
          }}
        />
      ) : null}

      <div
        className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg bg-[rgba(15,23,42,0.78)] px-3 py-1.5 font-mono text-[11px] text-slate-100 shadow"
        aria-live="off"
      >
        z{zoom.toFixed(1)}
        {cursor ? ` · ${cursor[0].toFixed(4)}, ${cursor[1].toFixed(4)}` : ""}
        {snapTarget ? ` · snap: ${snapTarget.name.en}` : ""}
      </div>
    </>
  );
}

export function EditorMap(props: EditorMapProps) {
  const { tileUrl, fitRequest, tool, ...layerProps } = props;

  return (
    <div className="rme-map relative h-full w-full" data-tool={tool}>
      <MapContainer
        center={DEFAULT_MAP_VIEW.center}
        zoom={DEFAULT_MAP_VIEW.zoom}
        minZoom={EDITOR_MIN_ZOOM}
        maxZoom={EDITOR_MAX_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer key={tileUrl} url={tileUrl} subdomains={["0", "1", "2", "3"]} />
        <ZoomControl position="bottomright" />
        <DoubleClickZoomSwitch enabled={tool !== "draw"} />
        <EditorLayers tool={tool} {...layerProps} />
        {/* After the layers: a fit on a map that has not loaded yet fires
            zoomend synchronously, which the layers must already be listening
            for. */}
        <FitController request={fitRequest} />
      </MapContainer>
    </div>
  );
}
