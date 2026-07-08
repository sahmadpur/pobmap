import type { Coordinate } from "@/types/map";

export interface PathSampler {
  totalLength: number;
  pointAt(distance: number): Coordinate;
}

// Distances use the same planar lat/lng-degree convention as
// interpolateAlongPath in map-utils.ts; the layer only needs relative
// positions along a path, not real-world meters.
export function createPathSampler(coordinates: Coordinate[]): PathSampler {
  const cumulative: number[] = [0];

  for (let index = 1; index < coordinates.length; index += 1) {
    const [previousLat, previousLng] = coordinates[index - 1];
    const [lat, lng] = coordinates[index];
    cumulative.push(
      cumulative[index - 1] + Math.hypot(lat - previousLat, lng - previousLng),
    );
  }

  const totalLength = coordinates.length > 1 ? cumulative[cumulative.length - 1] : 0;

  function pointAt(distance: number): Coordinate {
    if (coordinates.length === 0) {
      return [0, 0];
    }

    if (coordinates.length === 1 || totalLength === 0) {
      return coordinates[0];
    }

    const target = Math.min(Math.max(distance, 0), totalLength);

    let low = 0;
    let high = cumulative.length - 1;

    while (low < high) {
      const mid = (low + high) >> 1;

      if (cumulative[mid] < target) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const upper = Math.max(1, low);
    const spanStart = cumulative[upper - 1];
    const spanLength = cumulative[upper] - spanStart;
    const spanProgress = spanLength === 0 ? 0 : (target - spanStart) / spanLength;
    const [startLat, startLng] = coordinates[upper - 1];
    const [endLat, endLng] = coordinates[upper];

    return [
      startLat + (endLat - startLat) * spanProgress,
      startLng + (endLng - startLng) * spanProgress,
    ];
  }

  return { totalLength, pointAt };
}

export function headingDegrees(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

export function isLeftward(headingDeg: number): boolean {
  const normalized = ((headingDeg % 360) + 360) % 360;

  return normalized > 90 && normalized < 270;
}
