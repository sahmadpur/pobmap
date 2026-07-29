import type { AdminMarker, MarkerTier } from "@/types/admin";

export type { MarkerTier };

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
 * A marker is major only where `marker.corridorTiers` explicitly says so for
 * one of the currently-active corridors — there is no heuristic promotion.
 * Too many markers ranking themselves "major" is exactly what buries the map
 * in overlapping pins, so only the stakeholder-specified headline cities are
 * always visible; every other marker defaults to `standard` (zoom-gated)
 * until an admin deliberately marks it major.
 *
 * `activeCorridorIds` is usually the corridors currently enabled/visible on
 * the map. A marker can be major on one corridor and standard on another
 * (e.g. Aktau is a headline stop on East-West but a minor waypoint on
 * North-West); when several active corridors disagree, major wins.
 */
export function getMarkerTier(
  marker: AdminMarker,
  activeCorridorIds?: string[],
): MarkerTier {
  if (marker.id === ALWAYS_MAJOR_MARKER_ID) {
    return "major";
  }

  if (marker.corridorTiers && activeCorridorIds?.length) {
    const overrides = activeCorridorIds
      .map((corridorId) => marker.corridorTiers?.[corridorId])
      .filter((tier): tier is MarkerTier => Boolean(tier));

    if (overrides.includes("major")) {
      return "major";
    }
  }

  return "standard";
}

export function isMarkerVisibleAtZoom(
  marker: AdminMarker,
  zoom: number,
  activeCorridorIds?: string[],
): boolean {
  return zoom >= MARKER_MIN_ZOOM[getMarkerTier(marker, activeCorridorIds)];
}
