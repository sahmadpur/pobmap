import {
  getSegmentRenderCoordinates,
  sliceSegmentBetweenStops,
  softenPathCorners,
} from "@/lib/map-utils";
import { createPathSampler } from "@/lib/vehicle-path";
import type {
  Coordinate,
  CorridorRoute,
  CorridorSegment,
  TransportMode,
} from "@/types/map";

// How many segments of each mode get a vehicle once the pinned ones are placed.
// Quotas are per mode rather than per route so short sea crossings still get a
// ship: picking the longest N segments regardless of mode used to starve the
// Caspian legs against the trans-Eurasian rail hauls.
const MAX_ANIMATED_SEGMENTS_PER_MODE: Record<TransportMode, number> = {
  rail: 6,
  ship: 12,
  road: 4,
};

// Backstop for the case where every corridor is enabled at once. Pinned
// vehicles are placed first so this can never drop one.
const MAX_ANIMATED_VEHICLES = 60;

// Corridors whose traffic reads as a single freight flow out of Asia toward
// Europe. Every vehicle on them travels toward decreasing longitude instead of
// alternating direction, so the corridor tells one story rather than looking
// like shuttle traffic. Feeder branches orient correctly too: on East-West,
// Kunming-Hanoi and Kunming-Fangcheng flip to run inbound from the ports; on
// North-West, the Trans-Siberian arm and the Japan/Korea sea legs run inbound
// from the Pacific toward Moscow.
//
// `middle-corridor` and `eurasian-corridor` are the legacy ids of the same two
// corridors in the corridors.ts seed set, used when the admin store is missing.
const WESTBOUND_ROUTE_IDS = new Set([
  "east-west",
  "middle-corridor",
  "north-west",
  "eurasian-corridor",
]);

/** One stretch of a journey: part or all of a single segment, in travel order. */
interface PinnedLeg {
  segmentId: string;
  fromStopId: string;
  toStopId: string;
}

interface PinnedVehicle {
  /** Short slug used in the plan key. */
  id: string;
  routeId: string;
  /** Stitched head to tail into one continuous path. */
  legs: PinnedLeg[];
  /**
   * Where in its own loop the vehicle starts, 0-1. Left unset the layer spaces
   * vehicles out by plan order; pinning it to the same value on two journeys
   * makes them depart together.
   */
  startFraction?: number;
}

// Journeys stakeholders expect to see running at all times. Without these the
// longest-N heuristic decides: the Caspian ship's direction depended on its
// position in the flattened list, Baku-Kars never placed against the six
// longest rail hauls, and no vehicle ever crossed a segment boundary.
const PINNED_VEHICLES: PinnedVehicle[] = [
  // The Caspian crossing, always sailing Aktau -> Baku.
  {
    id: "aktau-baku",
    routeId: "east-west",
    legs: [
      {
        segmentId: "east-west-caspian-kz",
        fromStopId: "aktau",
        toStopId: "baku-port",
      },
    ],
  },
  // The Azerbaijani leg of the BTK line. Boyuk Kasik is a mid-stop of
  // east-west-btk (Baku - Ganja - Boyuk Kasik - Tbilisi - Kars), not a segment
  // of its own, so this animates a sub-path of the drawn line.
  {
    id: "baku-boyuk-kasik",
    routeId: "east-west",
    legs: [
      {
        segmentId: "east-west-btk",
        fromStopId: "baku-port",
        toStopId: "boyuk-kasik",
      },
    ],
  },
  // The North-West corridor runs two trains that leave on the same beat: one
  // down the Caspian shore from Moscow to Baku, one west out of Baku along
  // BTK. Both are spelled out because the first runs against the corridor's
  // westbound default, and both pin startFraction so they stay in step.
  {
    id: "moscow-baku",
    routeId: "north-west",
    startFraction: 0,
    legs: [
      {
        segmentId: "north-west-main-1",
        fromStopId: "moscow",
        toStopId: "yalama",
      },
      {
        segmentId: "north-west-yalama-baku",
        fromStopId: "yalama",
        toStopId: "baku-port",
      },
    ],
  },
  {
    id: "baku-kars",
    routeId: "north-west",
    startFraction: 0,
    legs: [
      {
        segmentId: "north-west-btk",
        fromStopId: "baku-port",
        toStopId: "kars",
      },
    ],
  },
];

export interface VehiclePlan {
  /** Stable identifier, useful for tests and debugging. */
  key: string;
  mode: TransportMode;
  /** Softened render path the vehicle rides, in authoring order. */
  coordinates: Coordinate[];
  /** True when the vehicle travels from the end of `coordinates` to the start. */
  reversed: boolean;
  speed: number;
  /** Fixed start phase, 0-1; unset means the layer spaces the vehicle by order. */
  startFraction?: number;
}

function pathLength(coordinates: Coordinate[]): number {
  return createPathSampler(coordinates).totalLength;
}

/**
 * Direction that carries a vehicle toward Europe.
 *
 * Derived from the path's own geometry rather than a hand-maintained list of
 * segment orientations, so it keeps working as route data is edited.
 */
function isEastbound(coordinates: Coordinate[]): boolean {
  return coordinates[coordinates.length - 1][1] > coordinates[0][1];
}

function planPinnedVehicles(routes: CorridorRoute[]): {
  plans: VehiclePlan[];
  pinnedSegmentIds: Set<string>;
} {
  const plans: VehiclePlan[] = [];
  const pinnedSegmentIds = new Set<string>();

  PINNED_VEHICLES.forEach((pinned) => {
    const route = routes.find((candidate) => candidate.id === pinned.routeId);

    // Silently skipped when a corridor is filtered out, a mode is disabled, or
    // the underlying route data has moved on. Pinned data must never break the
    // whole layer.
    if (!route) {
      return;
    }

    const coordinates: Coordinate[] = [];
    const touchedSegmentIds: string[] = [];
    let mode: TransportMode | null = null;

    for (const leg of pinned.legs) {
      const segment = route.segments.find(
        (candidate) => candidate.id === leg.segmentId,
      );
      const slice =
        segment &&
        sliceSegmentBetweenStops(segment, leg.fromStopId, leg.toStopId);

      // A journey is all or nothing: a missing leg would teleport the vehicle
      // across the gap, which reads worse than not running it at all.
      if (!segment || !slice) {
        return;
      }

      mode ??= segment.mode;
      touchedSegmentIds.push(segment.id);

      slice.forEach((coordinate) => {
        const previous = coordinates[coordinates.length - 1];

        // Consecutive legs meet at a shared stop; keep the junction once.
        if (
          !previous ||
          previous[0] !== coordinate[0] ||
          previous[1] !== coordinate[1]
        ) {
          coordinates.push(coordinate);
        }
      });
    }

    // Softened as one path so multi-leg journeys round their junction corners
    // the same way the drawn lines do.
    const path = softenPathCorners(coordinates);

    if (!mode || pathLength(path) <= 0) {
      return;
    }

    touchedSegmentIds.forEach((segmentId) => {
      pinnedSegmentIds.add(`${route.id}:${segmentId}`);
    });

    plans.push({
      key: `${route.id}:${pinned.id}`,
      mode,
      coordinates: path,
      // Legs are already stitched in travel order.
      reversed: false,
      speed: route.animationSpeed,
      startFraction: pinned.startFraction,
    });
  });

  return { plans, pinnedSegmentIds };
}

/**
 * Chooses which segments carry a vehicle, along which path, and in which
 * direction. Kept free of Leaflet so it stays unit-testable; the layer only
 * turns the result into SVG nodes.
 */
export function planVehicles(routes: CorridorRoute[]): VehiclePlan[] {
  const { plans: pinnedPlans, pinnedSegmentIds } = planPinnedVehicles(routes);

  const quotaPlans = routes.flatMap((route) => {
    const byMode = new Map<
      TransportMode,
      { segment: CorridorSegment; coordinates: Coordinate[]; length: number }[]
    >();

    route.segments.forEach((segment) => {
      // A pinned vehicle already runs this line; a second one would double up.
      if (pinnedSegmentIds.has(`${route.id}:${segment.id}`)) {
        return;
      }

      const coordinates = getSegmentRenderCoordinates(segment);
      const length = pathLength(coordinates);

      if (length <= 0) {
        return;
      }

      const group = byMode.get(segment.mode);
      const entry = { segment, coordinates, length };

      if (group) {
        group.push(entry);
      } else {
        byMode.set(segment.mode, [entry]);
      }
    });

    return Array.from(byMode.entries()).flatMap(([mode, group]) =>
      group
        .sort((a, b) => b.length - a.length)
        .slice(0, MAX_ANIMATED_SEGMENTS_PER_MODE[mode])
        .map(({ segment, coordinates }) => ({ route, segment, coordinates })),
    );
  });

  const filledPlans: VehiclePlan[] = quotaPlans.map(
    ({ route, segment, coordinates }, index) => ({
      key: `${route.id}:${segment.id}`,
      mode: segment.mode,
      coordinates,
      // Corridors outside the westbound set keep alternating traffic so both
      // freight directions stay visible.
      reversed: WESTBOUND_ROUTE_IDS.has(route.id)
        ? isEastbound(coordinates)
        : index % 2 === 1,
      speed: route.animationSpeed,
    }),
  );

  return [...pinnedPlans, ...filledPlans].slice(0, MAX_ANIMATED_VEHICLES);
}
