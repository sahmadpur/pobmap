"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, useMap } from "react-leaflet";

import { WorldBasemap, ZoomWatcher } from "@/components/map/corridor-map-canvas";

import type { Coordinate, CorridorSegment } from "@/types/map";

function pointIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #0b0f16;box-shadow:0 0 0 1px rgba(255,255,255,0.5);"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

const FIXED_ICON = pointIcon("#38bdf8");
const EDITABLE_ICON = pointIcon("#f97316");

function distanceToSegment(point: Coordinate, a: Coordinate, b: Coordinate): number {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;

  return Math.hypot(px - closestX, py - closestY);
}

function nearestInsertionIndex(points: Coordinate[], click: Coordinate): number {
  let bestIndex = 1;
  let bestDistance = Infinity;

  for (let i = 0; i < points.length - 1; i += 1) {
    const distance = distanceToSegment(click, points[i], points[i + 1]);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i + 1;
    }
  }

  return bestIndex;
}

function FitBounds({ points }: { points: Coordinate[] }) {
  const map = useMap();
  const boundsKey = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    if (points.length < 2) {
      return;
    }

    map.fitBounds(points as [number, number][], { padding: [24, 24] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey]);

  return null;
}

export function SegmentLineEditor({
  segment,
  onChange,
}: {
  segment: CorridorSegment;
  onChange: (segment: CorridorSegment) => void;
}) {
  const anchors = segment.coordinates;
  const rawPoints =
    segment.displayCoordinates && segment.displayCoordinates.length >= 2
      ? segment.displayCoordinates
      : anchors;

  const [zoom, setZoom] = useState(6);
  const points = useMemo(() => {
    if (rawPoints.length < 2 || anchors.length < 2) {
      return rawPoints;
    }

    return rawPoints.map((point, index) => {
      if (index === 0) {
        return anchors[0];
      }

      if (index === rawPoints.length - 1) {
        return anchors[anchors.length - 1];
      }

      return point;
    });
  }, [rawPoints, anchors]);

  if (points.length < 2) {
    return (
      <div className="hc-inset p-4">
        <p className="text-xs text-[var(--hc-muted)]">
          Add at least two stops above to shape this leg&apos;s line.
        </p>
      </div>
    );
  }

  function updatePoints(nextPoints: Coordinate[]) {
    onChange({ ...segment, displayCoordinates: nextPoints });
  }

  function handleDrag(index: number, latlng: L.LatLng) {
    const next = points.map((point, pointIndex) =>
      pointIndex === index ? ([latlng.lat, latlng.lng] as Coordinate) : point,
    );
    updatePoints(next);
  }

  function handleLineClick(event: L.LeafletMouseEvent) {
    const click: Coordinate = [event.latlng.lat, event.latlng.lng];
    const index = nearestInsertionIndex(points, click);
    updatePoints([...points.slice(0, index), click, ...points.slice(index)]);
  }

  function removePoint(index: number) {
    if (index === 0 || index === points.length - 1) {
      return;
    }

    updatePoints(points.filter((_, pointIndex) => pointIndex !== index));
  }

  function resetCurve() {
    onChange({ ...segment, displayCoordinates: undefined });
  }

  const center = points[Math.floor(points.length / 2)];
  const hasCurve = Boolean(segment.displayCoordinates && segment.displayCoordinates.length > 2);

  return (
    <div className="hc-inset overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="hc-label">Line shape</p>
          <p className="mt-1 text-xs text-[var(--hc-muted)]">
            Drag orange points to bend the line, click the line to add a point, double-click a
            point to remove it.
          </p>
        </div>
        <button
          type="button"
          onClick={resetCurve}
          disabled={!hasCurve}
          className="hc-btn hc-btn--xs disabled:opacity-40"
        >
          Reset to straight line
        </button>
      </div>

      <div className="h-72 overflow-hidden rounded-lg border border-[var(--hc-line)]">
        <MapContainer
          center={center}
          zoom={6}
          minZoom={3}
          maxZoom={8}
          scrollWheelZoom
          attributionControl={false}
          className="corridor-map-canvas h-full w-full"
        >
          {/* Same vector basemap as the public map, so edits land where they will show. */}
          <WorldBasemap theme="light" locale="en" zoom={zoom} labelledCoordinates={[]} />
          <ZoomWatcher onZoomChange={setZoom} />
          <FitBounds points={points} />
          <Polyline
            positions={points as [number, number][]}
            pathOptions={{ color: "#f97316", weight: 3 }}
            eventHandlers={{ click: handleLineClick }}
          />
          {points.map((point, index) => {
            const isFixed = index === 0 || index === points.length - 1;

            return (
              <Marker
                key={`${segment.id}-point-${index}`}
                position={point as [number, number]}
                icon={isFixed ? FIXED_ICON : EDITABLE_ICON}
                draggable={!isFixed}
                eventHandlers={
                  isFixed
                    ? undefined
                    : {
                        dragend: (event) => handleDrag(index, event.target.getLatLng()),
                        dblclick: () => removePoint(index),
                      }
                }
              />
            );
          })}
        </MapContainer>
      </div>

      <p className="mt-3 text-xs text-[var(--hc-muted)]">
        Blue points follow the segment&apos;s stops and can&apos;t be moved here — edit the stop
        list above instead. {points.length} point{points.length === 1 ? "" : "s"} total.
      </p>
    </div>
  );
}
