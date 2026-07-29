import {
  getTransportStop,
  getTransportStopByCoordinate,
} from "@/data/transport-stops";
import type { CorridorRoute, CorridorSegment } from "@/types/map";

function sanitizeStopIds(stopIds: string[] | undefined): string[] {
  return (stopIds ?? []).filter((stopId, index, values) => {
    if (!getTransportStop(stopId)) {
      return false;
    }

    return index === 0 || values[index - 1] !== stopId;
  });
}

export function inferStopIdsFromCoordinates(
  coordinates: CorridorSegment["coordinates"],
): string[] | null {
  const stopIds = coordinates.map((coordinate) => {
    return getTransportStopByCoordinate(coordinate)?.id ?? null;
  });

  if (stopIds.some((stopId) => stopId === null)) {
    return null;
  }

  return sanitizeStopIds(stopIds as string[]);
}

export function applyStopIdsToSegment(segment: CorridorSegment): CorridorSegment {
  const stopIds = sanitizeStopIds(segment.stopIds);
  const coordinates = stopIds
    .map((stopId) => getTransportStop(stopId)?.coordinates ?? null)
    .filter((coordinate): coordinate is NonNullable<typeof coordinate> => Boolean(coordinate));

  return {
    ...segment,
    stopIds,
    coordinates,
    displayCoordinates:
      segment.displayCoordinates && segment.displayCoordinates.length > 0
        ? segment.displayCoordinates
        : undefined,
  };
}

export function normalizeCorridorSegment(segment: CorridorSegment): CorridorSegment {
  if (segment.stopIds?.length) {
    return applyStopIdsToSegment(segment);
  }

  const inferredStopIds = inferStopIdsFromCoordinates(segment.coordinates);

  if (!inferredStopIds || inferredStopIds.length < 2) {
    return segment;
  }

  return {
    ...segment,
    stopIds: inferredStopIds,
  };
}

/**
 * Stops where a corridor terminates — the outer end of each of its branches.
 *
 * A corridor is a branching network, not a single path, so start and end cannot
 * be read off the segment array: `segments[0]` and the last segment reflect
 * authoring order (East-West would report Dalian and Madrid). Instead this walks
 * the corridor graph and returns every stop with exactly one neighbour, which
 * picks out the real gateways — the Chinese ports, the European terminals, and
 * so on — while excluding junctions such as Tbilisi that only look like an
 * endpoint because one segment happens to stop there.
 */
export function collectRouteTerminalStopIds(route: CorridorRoute): string[] {
  const neighbours = new Map<string, Set<string>>();

  const link = (from: string, to: string) => {
    const adjacent = neighbours.get(from);

    if (adjacent) {
      adjacent.add(to);
    } else {
      neighbours.set(from, new Set([to]));
    }
  };

  route.segments.forEach((segment) => {
    const stopIds = segment.stopIds ?? [];

    stopIds.forEach((stopId, index) => {
      const next = stopIds[index + 1];

      if (!next || next === stopId) {
        return;
      }

      link(stopId, next);
      link(next, stopId);
    });
  });

  return Array.from(neighbours.entries())
    .filter(([, adjacent]) => adjacent.size === 1)
    .map(([stopId]) => stopId);
}

export function normalizeCorridorRoute(route: CorridorRoute): CorridorRoute {
  return {
    ...route,
    segments: route.segments.map(normalizeCorridorSegment),
  };
}
