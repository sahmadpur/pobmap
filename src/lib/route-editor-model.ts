import { getTransportStop, getTransportStopByCoordinate } from "@/data/transport-stops";
import { nearestVertexIndex } from "@/lib/map-utils";
import type { Coordinate, CorridorRoute, CorridorSegment, LocalizedText } from "@/types/map";

/**
 * One draggable point of a leg in the map editor.
 *
 * A vertex either sits on a city (`stopId`) or is a free bend point. The public
 * map derives everything from this split: `stopIds` and `coordinates` from the
 * anchored vertices, `displayCoordinates` from all of them.
 */
export interface EditorVertex {
  coordinate: Coordinate;
  stopId: string | null;
}

/** How near two coordinates must be to count as the same place, in degrees. */
const SAME_PLACE_TOLERANCE = 1e-6;

export function isSameCoordinate(first: Coordinate, second: Coordinate): boolean {
  return (
    Math.abs(first[0] - second[0]) < SAME_PLACE_TOLERANCE &&
    Math.abs(first[1] - second[1]) < SAME_PLACE_TOLERANCE
  );
}

/**
 * Expands a stored segment into editor vertices.
 *
 * The drawn line (`displayCoordinates`, falling back to the stop coordinates)
 * supplies the points; the segment's stops are then pinned onto it in order.
 * First and last stops always take the first and last vertex, matching how the
 * public map treats them, and intermediate stops claim the nearest free vertex
 * after the previous stop so the order can never flip.
 */
export function segmentToVertices(segment: CorridorSegment): EditorVertex[] {
  const stopIds = (segment.stopIds ?? []).filter((stopId) => getTransportStop(stopId));
  const source =
    segment.displayCoordinates && segment.displayCoordinates.length >= 2
      ? segment.displayCoordinates
      : segment.coordinates;

  if (source.length === 0) {
    return stopIds.map((stopId) => ({
      coordinate: getTransportStop(stopId)!.coordinates,
      stopId,
    }));
  }

  const vertices: EditorVertex[] = source.map((coordinate) => ({
    coordinate,
    stopId: null,
  }));

  let cursor = -1;

  stopIds.forEach((stopId, index) => {
    const stop = getTransportStop(stopId)!;
    const isFirst = index === 0;
    const isLast = index === stopIds.length - 1;
    let vertexIndex: number;

    if (isFirst) {
      vertexIndex = 0;
    } else if (isLast) {
      vertexIndex = vertices.length - 1;
    } else {
      const candidates = vertices.slice(cursor + 1, vertices.length - 1);

      if (candidates.length === 0) {
        // More stops than free vertices: grow the line instead of losing a stop.
        vertices.splice(cursor + 1, 0, { coordinate: stop.coordinates, stopId });
        cursor += 1;
        return;
      }

      vertexIndex =
        cursor +
        1 +
        nearestVertexIndex(
          candidates.map((vertex) => vertex.coordinate),
          stop.coordinates,
        );
    }

    if (isLast && vertexIndex <= cursor) {
      // A two-point line whose stops collapsed onto one vertex; add the end.
      vertices.push({ coordinate: stop.coordinates, stopId });
      cursor = vertices.length - 1;
      return;
    }

    vertices[vertexIndex] = { coordinate: stop.coordinates, stopId };
    cursor = vertexIndex;
  });

  // Legacy segments stored only coordinates; a vertex that lands exactly on a
  // known city is that city.
  const claimed = new Set(vertices.map((vertex) => vertex.stopId).filter(Boolean));

  return vertices.map((vertex) => {
    if (vertex.stopId) {
      return vertex;
    }

    const stop = getTransportStopByCoordinate(vertex.coordinate);

    if (!stop || claimed.has(stop.id)) {
      return vertex;
    }

    claimed.add(stop.id);

    return { coordinate: stop.coordinates, stopId: stop.id };
  });
}

/** Stop ids in vertex order with consecutive repeats collapsed. */
export function verticesToStopIds(vertices: EditorVertex[]): string[] {
  return vertices
    .map((vertex) => vertex.stopId)
    .filter((stopId, index, all): stopId is string =>
      Boolean(stopId) && (index === 0 || all[index - 1] !== stopId),
    );
}

function hasText(text: LocalizedText | undefined): boolean {
  return Boolean(text && (text.az || text.en || text.ru));
}

/**
 * Folds editor vertices back into a segment.
 *
 * From/To labels follow the end cities unless the leg already had a label and
 * its end city did not change — a hand-written label survives a reshape.
 */
export function verticesToSegment(
  segment: CorridorSegment,
  vertices: EditorVertex[],
): CorridorSegment {
  const stopIds = verticesToStopIds(vertices);
  const coordinates = stopIds
    .map((stopId) => getTransportStop(stopId)?.coordinates ?? null)
    .filter((coordinate): coordinate is Coordinate => Boolean(coordinate));
  const displayCoordinates = vertices.map((vertex) => vertex.coordinate);
  const previousStopIds = segment.stopIds ?? [];
  const firstStop = stopIds[0] ? getTransportStop(stopIds[0]) : null;
  const lastStop = stopIds.length > 1 ? getTransportStop(stopIds[stopIds.length - 1]) : null;
  const from =
    firstStop && (!hasText(segment.from) || previousStopIds[0] !== firstStop.id)
      ? firstStop.name
      : segment.from;
  const to =
    lastStop &&
    (!hasText(segment.to) || previousStopIds[previousStopIds.length - 1] !== lastStop.id)
      ? lastStop.name
      : segment.to;

  return {
    ...segment,
    from,
    to,
    stopIds,
    coordinates,
    displayCoordinates: displayCoordinates.length >= 2 ? displayCoordinates : undefined,
  };
}

/** Human-readable reasons a leg cannot be saved; empty when it can. */
export function validateVertices(vertices: EditorVertex[]): string[] {
  const issues: string[] = [];

  if (vertices.length < 2) {
    issues.push("A leg needs at least two points.");
    return issues;
  }

  if (!vertices[0].stopId) {
    issues.push("The leg must start on a city.");
  }

  if (!vertices[vertices.length - 1].stopId) {
    issues.push("The leg must end on a city.");
  }

  const stopIds = verticesToStopIds(vertices);

  if (stopIds.length >= 2 && stopIds[0] === stopIds[stopIds.length - 1]) {
    issues.push("The leg starts and ends on the same city.");
  }

  return issues;
}

export function reverseVertices(vertices: EditorVertex[]): EditorVertex[] {
  return [...vertices].reverse();
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(first: Coordinate, second: Coordinate): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second[0] - first[0]);
  const longitudeDelta = toRadians(second[1] - first[1]);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first[0])) *
      Math.cos(toRadians(second[0])) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Great-circle length along the drawn line, rounded to whole kilometres. */
export function pathLengthKm(coordinates: Coordinate[]): number {
  let total = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    total += haversineKm(coordinates[index - 1], coordinates[index]);
  }

  return Math.round(total);
}

type Point = readonly [number, number];

function distanceToEdge(point: Point, a: Point, b: Point): number {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Where a new point clicked near a polyline should be spliced in: after the
 * vertex that starts the closest edge. Works in any planar space; the editor
 * passes screen pixels so zoom does not skew the choice.
 */
export function nearestInsertionIndex(points: Point[], click: Point): number {
  let bestIndex = 1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length - 1; index += 1) {
    const distance = distanceToEdge(click, points[index], points[index + 1]);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index + 1;
    }
  }

  return bestIndex;
}

/**
 * Moves every vertex anchored to `stopId` onto the city's new coordinates and
 * rebuilds those segments, returning only the routes that changed. Used after a
 * custom city is dragged so the drawn lines follow it without a manual re-save.
 * Must run after the registry knows the new coordinates.
 */
export function relocateStopInRoutes(
  routes: CorridorRoute[],
  stopId: string,
  coordinate: Coordinate,
): CorridorRoute[] {
  const changed: CorridorRoute[] = [];

  routes.forEach((route) => {
    let touched = false;
    const segments = route.segments.map((segment) => {
      if (!(segment.stopIds ?? []).includes(stopId)) {
        return segment;
      }

      touched = true;
      const vertices = segmentToVertices(segment).map((vertex) =>
        vertex.stopId === stopId ? { ...vertex, coordinate } : vertex,
      );

      return verticesToSegment(segment, vertices);
    });

    if (touched) {
      changed.push({ ...route, segments });
    }
  });

  return changed;
}

/**
 * Takes a city out of every leg that uses it, ahead of deleting the city.
 *
 * A leg ending (or starting) on the city is shortened to the next city along
 * it, dropping the stretch beyond; a city in the middle of a leg becomes a
 * plain bend so the line keeps its shape. A leg left with a single city has
 * nothing to draw and is removed. Returns the corridors that changed.
 */
export function detachStopFromRoutes(
  routes: CorridorRoute[],
  stopId: string,
): {
  routes: CorridorRoute[];
  removedLegs: { routeId: string; segmentId: string }[];
} {
  const changed: CorridorRoute[] = [];
  const removedLegs: { routeId: string; segmentId: string }[] = [];

  routes.forEach((route) => {
    let touched = false;
    const segments = route.segments.flatMap((segment) => {
      if (!(segment.stopIds ?? []).includes(stopId)) {
        return [segment];
      }

      touched = true;
      let vertices = segmentToVertices(segment);
      const isAnchor = (vertex: EditorVertex) => Boolean(vertex.stopId) && vertex.stopId !== stopId;
      const first = vertices.findIndex(isAnchor);
      const last = vertices.findLastIndex(isAnchor);

      if (first < 0 || first === last) {
        removedLegs.push({ routeId: route.id, segmentId: segment.id });
        return [];
      }

      const endsMoved = first > 0 || last < vertices.length - 1;
      vertices = vertices
        .slice(first, last + 1)
        .map((vertex) => (vertex.stopId === stopId ? { ...vertex, stopId: null } : vertex));
      const next = verticesToSegment(segment, vertices);

      return [
        endsMoved
          ? { ...next, distanceKm: pathLengthKm(vertices.map((vertex) => vertex.coordinate)) }
          : next,
      ];
    });

    if (touched) {
      changed.push({ ...route, segments });
    }
  });

  return { routes: changed, removedLegs };
}

/** Lowercase dashed id from a city name, e.g. "Bandar-e Anzali" -> "bandar-e-anzali". */
export function slugifyStopId(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Undo/redo as plain data so it can live in React state. */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

const HISTORY_LIMIT = 100;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(history: History<T>, next: T): History<T> {
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

export function undoHistory<T>(history: History<T>): History<T> {
  const previous = history.past[history.past.length - 1];

  if (previous === undefined) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future;

  if (next === undefined) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}
