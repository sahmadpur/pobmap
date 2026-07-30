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
  if (segment.displayCoordinates && segment.displayCoordinates.length >= 2) {
    return softenPathCorners(segment.displayCoordinates);
  }

  return softenPathCorners(segment.coordinates);
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

