import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

import type { Coordinate } from "@/types/map";

/**
 * Even-odd ray casting: a point is inside a ring when a ray cast to the east
 * crosses the ring's edges an odd number of times. Positions are GeoJSON order,
 * `[lng, lat]`.
 */
export function isPointInRing(point: Position, ring: Position[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

/** Inside the outer ring and outside every hole. */
export function isPointInPolygon(point: Position, polygon: Position[][]): boolean {
  if (polygon.length === 0 || !isPointInRing(point, polygon[0])) {
    return false;
  }

  return !polygon.slice(1).some((hole) => isPointInRing(point, hole));
}

function isPointInGeometry(point: Position, geometry: Geometry): boolean {
  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
  }

  return false;
}

/**
 * ISO-2 code of the country a `[lat, lng]` point falls in, read off the
 * countries GeoJSON the basemap already ships (`properties.iso`). Null at sea
 * or outside every feature.
 */
export function findCountryIsoAtPoint(
  countries: FeatureCollection | null,
  coordinate: Coordinate,
): string | null {
  if (!countries) {
    return null;
  }

  const point: Position = [coordinate[1], coordinate[0]];
  const match = countries.features.find((feature: Feature) =>
    isPointInGeometry(point, feature.geometry),
  );
  const iso = (match?.properties as { iso?: unknown } | null)?.iso;

  return typeof iso === "string" ? iso : null;
}
