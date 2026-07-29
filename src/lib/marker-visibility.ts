import type { AdminMarker } from "@/types/admin";

export type MarkerTier = "major" | "standard";

/**
 * Lowest zoom at which each class of map feature is drawn.
 *
 * Zoomed out, the corridors are the story and a full set of pins buries the
 * lines, so detail is revealed progressively:
 *
 * - `major`    strategic ports and multi-corridor hubs — visible at every zoom
 * - `standard` the remaining corridor markers
 * - `stop`     intermediate stop dots along a corridor, plus every label
 *
 * The map is clamped to zoom 3-7 (`corridor-map-canvas.tsx`), so `major` at 3
 * means "always".
 */
export const MARKER_MIN_ZOOM = {
  major: 3,
  standard: 5,
  stop: 6,
} as const;

/** Zoom at or above which permanent marker/stop labels are drawn. */
export const LABEL_MIN_ZOOM = MARKER_MIN_ZOOM.standard;

/** The hub marker anchors the whole map and is never tiered away. */
const ALWAYS_MAJOR_MARKER_ID = "baku-port";

/**
 * Ranks a marker from data already on it, rather than a hand-tuned field, so
 * newly added markers get a sensible tier without extra admin work.
 */
export function getMarkerTier(
  marker: AdminMarker,
  connectedRouteCount: number,
): MarkerTier {
  if (marker.id === ALWAYS_MAJOR_MARKER_ID) {
    return "major";
  }

  // A junction serving three or more corridors is strategic whatever it is.
  if (connectedRouteCount >= 3) {
    return "major";
  }

  // Seaports carry the corridor handoffs, so they surface earlier than the
  // inland stations and cities that sit between them.
  if (marker.category === "port" && connectedRouteCount >= 2) {
    return "major";
  }

  return "standard";
}

export function isMarkerVisibleAtZoom(
  marker: AdminMarker,
  connectedRouteCount: number,
  zoom: number,
): boolean {
  return zoom >= MARKER_MIN_ZOOM[getMarkerTier(marker, connectedRouteCount)];
}
