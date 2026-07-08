import type { Coordinate, CorridorRoute, CorridorSegment } from "@/types/map";

function getDistance(first: Coordinate, second: Coordinate): number {
  return Math.hypot(second[0] - first[0], second[1] - first[1]);
}

// Ratio of each corner that gets cut when rounding polylines. Endpoints are
// preserved so segments keep meeting exactly at shared stops.
const CORNER_SOFTENING_RATIO = 0.15;

function softenCorners(coordinates: Coordinate[]): Coordinate[] {
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
    return softenCorners(segment.displayCoordinates);
  }

  return softenCorners(segment.coordinates);
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

export function interpolateAlongPath(
  coordinates: Coordinate[],
  progress: number,
): Coordinate {
  if (coordinates.length === 0) {
    return [40.3572, 49.835];
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const normalizedProgress = ((progress % 1) + 1) % 1;
  const segmentLengths = coordinates.slice(1).map((coordinate, index) => {
    return getDistance(coordinates[index], coordinate);
  });
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  const targetDistance = totalLength * normalizedProgress;

  let traversed = 0;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];

    if (traversed + segmentLength >= targetDistance) {
      const segmentProgress = (targetDistance - traversed) / segmentLength;
      const start = coordinates[index];
      const end = coordinates[index + 1];

      return [
        start[0] + (end[0] - start[0]) * segmentProgress,
        start[1] + (end[1] - start[1]) * segmentProgress,
      ];
    }

    traversed += segmentLength;
  }

  return coordinates[coordinates.length - 1];
}
