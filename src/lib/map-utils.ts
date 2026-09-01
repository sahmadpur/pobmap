import {
  getTransportStop,
  getTransportStopByCoordinate,
} from "@/data/transport-stops";
import type { Coordinate, CorridorRoute, CorridorSegment } from "@/types/map";

// Ratio of each corner that gets cut when rounding polylines. Endpoints are
// preserved so segments keep meeting exactly at shared stops.
const CORNER_SOFTENING_RATIO = 0.15;

// Exported so a sliced sub-path (see vehicle-plan.ts) gets the same treatment as
// the drawn polyline. Softening is local — each interior vertex only consults
// its immediate neighbours — so a slice rounds identically to the full path,
// apart from the cut points, which stay exact.
export function softenPathCorners(coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length < 3) {
    return coordinates;
  }

  const softened: Coordinate[] = [coordinates[0]];

  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const [previousLat, previousLng] = coordinates[index - 1];
    const [lat, lng] = coordinates[index];
    const [nextLat, nextLng] = coordinates[index + 1];

    // A vertex that is a stop must stay on the line — cutting the corner would
    // draw the corridor past the stop marker instead of through it.
    if (getTransportStopByCoordinate(coordinates[index])) {
      softened.push(coordinates[index]);
      continue;
    }

    softened.push(
      [
        lat + (previousLat - lat) * CORNER_SOFTENING_RATIO,
        lng + (previousLng - lng) * CORNER_SOFTENING_RATIO,
      ],
      [
        lat + (nextLat - lat) * CORNER_SOFTENING_RATIO,
        lng + (nextLng - lng) * CORNER_SOFTENING_RATIO,
      ],
    );
  }

  softened.push(coordinates[coordinates.length - 1]);

  return softened;
}

export function getSegmentRenderCoordinates(segment: CorridorSegment): Coordinate[] {
  return softenPathCorners(getSegmentSourceCoordinates(segment));
}

/** The raw authored line a segment draws from, before corner softening. */
function getSegmentSourceCoordinates(segment: CorridorSegment): Coordinate[] {
  return segment.displayCoordinates && segment.displayCoordinates.length >= 2
    ? segment.displayCoordinates
    : segment.coordinates;
}

/**
 * Index of the polyline vertex closest to `target`.
 *
 * Stops are matched by proximity rather than equality because a segment's
 * `displayCoordinates` carries hand-authored bend points alongside the stop
 * vertices, and floating-point coordinates copied between the store and the
 * stop catalogue are not guaranteed to be bit-identical.
 */
export function nearestVertexIndex(
  coordinates: Coordinate[],
  target: Coordinate,
): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  coordinates.forEach(([lat, lng], index) => {
    const distance = Math.hypot(lat - target[0], lng - target[1]);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/**
 * The stretch of a segment's drawn line between two of its stops, in travel
 * order — reversed when the origin stop sits after the destination in the
 * authored array. Corners are left un-softened so consecutive legs can be
 * stitched and rounded as one path.
 *
 * Returns null when either stop is unknown or both land on the same vertex,
 * which would leave nothing to animate.
 */
export function sliceSegmentBetweenStops(
  segment: CorridorSegment,
  fromStopId: string,
  toStopId: string,
): Coordinate[] | null {
  const fromStop = getTransportStop(fromStopId);
  const toStop = getTransportStop(toStopId);

  if (!fromStop || !toStop) {
    return null;
  }

  const source = getSegmentSourceCoordinates(segment);

  if (source.length < 2) {
    return null;
  }

  const fromIndex = nearestVertexIndex(source, fromStop.coordinates);
  const toIndex = nearestVertexIndex(source, toStop.coordinates);

  if (fromIndex === toIndex) {
    return null;
  }

  const slice = source.slice(
    Math.min(fromIndex, toIndex),
    Math.max(fromIndex, toIndex) + 1,
  );

  return fromIndex > toIndex ? [...slice].reverse() : slice;
}

/** One stretch of a segment that should draw dotted rather than solid. */
export interface DottedStretch {
  routeId: string;
  segmentId: string;
  fromStopId: string;
  toStopId: string;
}

export interface SegmentRuns {
  solid: Coordinate[][];
  dotted: Coordinate[][];
}

/**
 * Splits a segment's drawn line into solid and dotted runs.
 *
 * The stretches that need dotting (unbuilt track, for the most part) are
 * sub-paths inside a larger segment rather than segments of their own, so the
 * line has to be cut at the two stop vertices and the middle piece styled
 * separately. Softening each piece on its own is safe because
 * `softenPathCorners` only ever consults a vertex's immediate neighbours, and
 * the cut points are preserved exactly, so the runs meet without a visible seam.
 *
 * With no matching stretch this returns the single solid run the caller would
 * have drawn anyway.
 */
export function splitSegmentForDotting(
  routeId: string,
  segment: CorridorSegment,
  stretches: DottedStretch[],
): SegmentRuns {
  const source = getSegmentSourceCoordinates(segment);
  const matches = stretches.filter(
    (stretch) => stretch.routeId === routeId && stretch.segmentId === segment.id,
  );

  if (source.length < 2 || matches.length === 0) {
    return { solid: [softenPathCorners(source)], dotted: [] };
  }

  // Cut points as ascending index ranges, so a stretch authored in either
  // travel direction lands on the same slice of the authored array.
  const ranges: Array<[number, number]> = [];

  matches.forEach((stretch) => {
    const fromStop = getTransportStop(stretch.fromStopId);
    const toStop = getTransportStop(stretch.toStopId);

    if (!fromStop || !toStop) {
      return;
    }

    const first = nearestVertexIndex(source, fromStop.coordinates);
    const second = nearestVertexIndex(source, toStop.coordinates);

    if (first === second) {
      return;
    }

    ranges.push([Math.min(first, second), Math.max(first, second)]);
  });

  if (ranges.length === 0) {
    return { solid: [softenPathCorners(source)], dotted: [] };
  }

  ranges.sort((a, b) => a[0] - b[0]);

  const solid: Coordinate[][] = [];
  const dotted: Coordinate[][] = [];
  let cursor = 0;

  ranges.forEach(([start, end]) => {
    if (start > cursor) {
      solid.push(softenPathCorners(source.slice(cursor, start + 1)));
    }

    dotted.push(softenPathCorners(source.slice(start, end + 1)));
    cursor = Math.max(cursor, end);
  });

  if (cursor < source.length - 1) {
    solid.push(softenPathCorners(source.slice(cursor)));
  }

  return { solid, dotted };
}

// Sideways shift, in screen pixels, between adjacent corridor lanes.
const CORRIDOR_OFFSET_STEP_PX = 3;

/**
 * The lane a corridor draws in, as a signed pixel offset from the centreline.
 *
 * The ladder alternates around zero (0, +3, -3, +6, -6) so the busiest corridor
 * keeps the true alignment and the rest fan out either side. The index comes
 * from the full corridor catalogue rather than the currently-filtered list, so
 * toggling a corridor off does not make the others change lanes.
 */
export function getCorridorOffsetPx(
  routeId: string,
  allRoutes: Pick<CorridorRoute, "id">[],
): number {
  const index = allRoutes.findIndex((route) => route.id === routeId);

  if (index <= 0) {
    return 0;
  }

  const lane = Math.ceil(index / 2) * CORRIDOR_OFFSET_STEP_PX;

  return index % 2 === 1 ? lane : -lane;
}

/**
 * Shifts a path sideways by a fixed number of screen pixels.
 *
 * Corridors share a great deal of track — the same Vienna-Duisburg line belongs
 * to three of them — and drawn on identical coordinates only the last one
 * rendered stays visible. Offsetting each corridor by a constant pixel amount
 * turns those overlaps into parallel ribbons while leaving the unshared
 * stretches visually unchanged.
 *
 * The projection pair is injected rather than taken from a Leaflet map so the
 * maths stays pure and testable. Offsets are applied in projected pixel space
 * and therefore hold their apparent width at every zoom level, which is why the
 * caller has to recompute on zoom.
 */
export function offsetPathPixels(
  coordinates: Coordinate[],
  offsetPx: number,
  project: (coordinate: Coordinate) => { x: number; y: number },
  unproject: (point: { x: number; y: number }) => Coordinate,
): Coordinate[] {
  if (offsetPx === 0 || coordinates.length < 2) {
    return coordinates;
  }

  const points = coordinates.map(project);

  const normals = points.map((point, index) => {
    // Interior vertices average their two edge normals so the offset line keeps
    // its corners; endpoints borrow the single edge they touch.
    const previous = points[index - 1] ?? point;
    const next = points[index + 1] ?? point;
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      return { x: 0, y: 0 };
    }

    return { x: -dy / length, y: dx / length };
  });

  return points.map((point, index) =>
    unproject({
      x: point.x + normals[index].x * offsetPx,
      y: point.y + normals[index].y * offsetPx,
    }),
  );
}

export function flattenRouteCoordinates(route: CorridorRoute): Coordinate[] {
  const flattened: Coordinate[] = [];

  route.segments.forEach((segment) => {
    getSegmentRenderCoordinates(segment).forEach((coordinate, index) => {
      const previous = flattened[flattened.length - 1];
      const isDuplicate =
        index === 0 &&
        previous &&
        previous[0] === coordinate[0] &&
        previous[1] === coordinate[1];

      if (!isDuplicate) {
        flattened.push(coordinate);
      }
    });
  });

  return flattened;
}

