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

export function normalizeCorridorRoute(route: CorridorRoute): CorridorRoute {
  return {
    ...route,
    segments: route.segments.map(normalizeCorridorSegment),
  };
}
