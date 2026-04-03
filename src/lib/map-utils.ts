import type { Coordinate, CorridorRoute } from "@/types/map";

function getDistance(first: Coordinate, second: Coordinate): number {
  return Math.hypot(second[0] - first[0], second[1] - first[1]);
}

export function flattenRouteCoordinates(route: CorridorRoute): Coordinate[] {
  const flattened: Coordinate[] = [];

  route.segments.forEach((segment) => {
    segment.coordinates.forEach((coordinate, index) => {
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

