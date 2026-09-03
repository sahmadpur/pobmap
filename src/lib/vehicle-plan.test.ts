import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getTransportStop } from "@/data/transport-stops";
import { normalizeCorridorRoute } from "@/lib/corridor-stop-utils";
import { getSegmentRenderCoordinates } from "@/lib/map-utils";
import { createPathSampler } from "@/lib/vehicle-path";
import { planVehicles, type VehiclePlan } from "@/lib/vehicle-plan";
import type {
  Coordinate,
  CorridorRoute,
  CorridorSegment,
  TransportMode,
} from "@/types/map";

const text = { az: "x", en: "x", ru: "x" };

function stopCoordinate(stopId: string): Coordinate {
  const stop = getTransportStop(stopId);

  if (!stop) {
    throw new Error(`missing test fixture stop: ${stopId}`);
  }

  return stop.coordinates;
}

function segment(
  id: string,
  coordinates: Coordinate[],
  mode: TransportMode = "rail",
  stopIds?: string[],
): CorridorSegment {
  return {
    id,
    mode,
    from: text,
    to: text,
    distanceKm: 100,
    coordinates,
    stopIds,
  };
}

function route(id: string, segments: CorridorSegment[]): CorridorRoute {
  return {
    id,
    name: text,
    routeColor: "#000000",
    type: "primary",
    totalDistanceKm: 100,
    transitTime: text,
    countries: [],
    description: text,
    status: "active",
    animationSpeed: 0.1,
    segments,
  };
}

/** Where the vehicle actually starts and ends, once `reversed` is applied. */
function travel(plan: VehiclePlan): { start: Coordinate; end: Coordinate } {
  const first = plan.coordinates[0];
  const last = plan.coordinates[plan.coordinates.length - 1];

  return plan.reversed
    ? { start: last, end: first }
    : { start: first, end: last };
}

function expectCloseTo(actual: Coordinate, expected: Coordinate) {
  expect(actual[0]).toBeCloseTo(expected[0], 3);
  expect(actual[1]).toBeCloseTo(expected[1], 3);
}

// The live corridor data the app renders, normalized the same way listRoutes
// does. Exercising the real store keeps the pinned segment and stop ids honest.
const liveRoutes: CorridorRoute[] = (
  JSON.parse(
    readFileSync(
      path.resolve(__dirname, "../data/admin-store.json"),
      "utf8",
    ),
  ) as { routes: CorridorRoute[] }
).routes.map(normalizeCorridorRoute);

const liveEastWest = liveRoutes.find((candidate) => candidate.id === "east-west")!;
const liveNorthWest = liveRoutes.find((candidate) => candidate.id === "north-west")!;

function plan(plans: VehiclePlan[], key: string): VehiclePlan {
  const found = plans.find((candidate) => candidate.key === key);

  if (!found) {
    throw new Error(`no vehicle planned for ${key}; got ${plans.map((p) => p.key).join(", ")}`);
  }

  return found;
}

/** Asserts the vehicle starts, passes through, and ends at the given stops. */
function expectJourney(plan: VehiclePlan, stopIds: string[]) {
  const { start, end } = travel(plan);

  expectCloseTo(start, stopCoordinate(stopIds[0]));
  expectCloseTo(end, stopCoordinate(stopIds[stopIds.length - 1]));

  stopIds.slice(1, -1).forEach((stopId) => {
    const target = stopCoordinate(stopId);
    const closest = Math.min(
      ...plan.coordinates.map((point) =>
        Math.hypot(point[0] - target[0], point[1] - target[1]),
      ),
    );

    expect(closest, `${plan.key} should pass through ${stopId}`).toBeLessThan(
      0.5,
    );
  });
}

function expectAllWestbound(plans: VehiclePlan[]) {
  expect(plans.length).toBeGreaterThan(0);

  plans.forEach((plan) => {
    const { start, end } = travel(plan);

    expect(
      end[1],
      `${plan.key} should travel west (${start[1]} -> ${end[1]})`,
    ).toBeLessThan(start[1]);
  });
}

describe("planVehicles on live East-West data", () => {
  const plans = planVehicles([liveEastWest]);

  it("sends every vehicle toward Europe", () => {
    expectAllWestbound(plans);
  });

  it("sails a ship from Aktau to Baku across the Caspian", () => {
    const caspian = plan(plans, "east-west:aktau-baku");

    expect(caspian.mode).toBe("ship");
    expectJourney(caspian, ["aktau", "baku-port"]);
  });

  it("runs a train from Baku to Boyuk Kasik along part of the BTK line", () => {
    const btk = plan(plans, "east-west:baku-boyuk-kasik");

    expect(btk.mode).toBe("rail");
    expectJourney(btk, ["baku-port", "boyuk-kasik"]);
  });

  it("stops the Baku train well short of Kars", () => {
    // The Alat-Kars line is authored as two segments, split at Boyuk Kasik.
    const fullLength = ["east-west-btk", "east-west-boyuk-kasik-kars"]
      .map(
        (segmentId) =>
          createPathSampler(
            getSegmentRenderCoordinates(
              liveEastWest.segments.find(
                (candidate) => candidate.id === segmentId,
              )!,
            ),
          ).totalLength,
      )
      .reduce((total, length) => total + length, 0);
    const subPathLength = createPathSampler(
      plan(plans, "east-west:baku-boyuk-kasik").coordinates,
    ).totalLength;

    expect(subPathLength).toBeGreaterThan(0);
    expect(subPathLength).toBeLessThan(fullLength * 0.7);
  });

  it("never places two vehicles on the same line", () => {
    expect(new Set(plans.map((p) => p.key)).size).toBe(plans.length);

    const btkTrains = plans.filter((p) =>
      p.key.endsWith("east-west-btk") || p.key.endsWith("baku-boyuk-kasik"),
    );

    expect(btkTrains).toHaveLength(1);
  });
});

describe("planVehicles on live North-West data", () => {
  const plans = planVehicles([liveNorthWest]);

  it("sends every vehicle toward Europe except the southbound Moscow train", () => {
    // moscow-baku runs down the Caspian shore, i.e. eastward — the one journey
    // that is pinned precisely because it defies the corridor's default.
    expectAllWestbound(
      plans.filter((candidate) => !candidate.key.endsWith("moscow-baku")),
    );
  });

  it("runs a train from Moscow down to Baku", () => {
    const journey = plan(plans, "north-west:moscow-baku");

    expect(journey.mode).toBe("rail");
    expectJourney(journey, ["moscow", "baku-port"]);
  });

  it("runs a second train from Baku west into Kars", () => {
    const journey = plan(plans, "north-west:baku-kars");

    expect(journey.mode).toBe("rail");
    expectJourney(journey, ["baku-port", "kars"]);
  });

  it("starts both Moscow-Baku and Baku-Kars on the same beat", () => {
    expect(plan(plans, "north-west:moscow-baku").startFraction).toBe(0);
    expect(plan(plans, "north-west:baku-kars").startFraction).toBe(0);
  });

  it("leaves the phase of unpinned vehicles to the layer", () => {
    const unpinned = plans.filter(
      (candidate) =>
        !candidate.key.endsWith("moscow-baku") &&
        !candidate.key.endsWith("baku-kars"),
    );

    expect(unpinned.length).toBeGreaterThan(0);
    unpinned.forEach((candidate) => {
      expect(candidate.startFraction).toBeUndefined();
    });
  });

  it("does not double up on segments a pinned journey already covers", () => {
    ["north-west-main-1", "north-west-yalama-baku", "north-west-btk"].forEach((segmentId) => {
      expect(
        plans.some((candidate) => candidate.key.endsWith(segmentId)),
        `${segmentId} should be left to its pinned journey`,
      ).toBe(false);
    });
  });
});

describe("planVehicles direction rules", () => {
  it("keeps alternating traffic on corridors outside the westbound set", () => {
    const eastward: Coordinate[] = [
      [40, 10],
      [40, 20],
    ];
    const plans = planVehicles([
      route("south-west", [
        segment("a", eastward),
        segment("b", eastward),
        segment("c", eastward),
      ]),
    ]);

    expect(plans.map((plan) => plan.reversed)).toEqual([false, true, false]);
  });

  it("reverses eastbound East-West geometry so travel still heads west", () => {
    const plans = planVehicles([
      route("east-west", [
        segment("eastward", [
          [40, 10],
          [40, 20],
        ]),
        segment("westward", [
          [40, 20],
          [40, 10],
        ]),
      ]),
    ]);

    expect(plans.find((plan) => plan.key.endsWith("eastward"))!.reversed).toBe(
      true,
    );
    expect(plans.find((plan) => plan.key.endsWith("westward"))!.reversed).toBe(
      false,
    );
  });

  it.each(["middle-corridor", "eurasian-corridor"])(
    "applies the westbound rule to the legacy %s id too",
    (routeId) => {
      const plans = planVehicles([
        route(routeId, [
          segment("eastward", [
            [40, 10],
            [40, 20],
          ]),
        ]),
      ]);

      expect(plans[0].reversed).toBe(true);
    },
  );
});

describe("planVehicles quotas", () => {
  it("keeps pinned vehicles when the global cap truncates the list", () => {
    const filler = Array.from({ length: 20 }, (_, routeIndex) =>
      route(
        `filler-${routeIndex}`,
        Array.from({ length: 6 }, (_, segmentIndex) =>
          segment(`filler-${routeIndex}-${segmentIndex}`, [
            [0, segmentIndex],
            [50, segmentIndex + 40],
          ]),
        ),
      ),
    );
    const eastWest = route("east-west", [
      segment(
        "east-west-caspian-kz",
        [stopCoordinate("aktau"), stopCoordinate("baku-port")],
        "ship",
        ["aktau", "baku-port"],
      ),
      segment(
        "east-west-btk",
        [
          stopCoordinate("baku-port"),
          stopCoordinate("ganja"),
          stopCoordinate("boyuk-kasik"),
          stopCoordinate("tbilisi"),
          stopCoordinate("kars"),
        ],
        "rail",
        ["baku-port", "ganja", "boyuk-kasik", "tbilisi", "kars"],
      ),
    ]);
    const plans = planVehicles([...filler, eastWest]);

    expect(plans.length).toBe(60);
    expect(plans[0].key).toBe("east-west:aktau-baku");
    expect(plans[1].key).toBe("east-west:baku-boyuk-kasik");
  });

  it("caps each mode independently", () => {
    const rails = Array.from({ length: 10 }, (_, index) =>
      segment(`rail-${index}`, [
        [0, 0],
        [index + 1, index + 1],
      ]),
    );
    const ships = Array.from({ length: 3 }, (_, index) =>
      segment(
        `ship-${index}`,
        [
          [0, 0],
          [index + 1, index + 1],
        ],
        "ship",
      ),
    );
    const plans = planVehicles([route("south-west", [...rails, ...ships])]);

    expect(plans.filter((plan) => plan.mode === "rail").length).toBe(6);
    expect(plans.filter((plan) => plan.mode === "ship").length).toBe(3);
  });
});

describe("planVehicles tolerance for missing data", () => {
  it("returns nothing for an empty route list", () => {
    expect(planVehicles([])).toEqual([]);
  });

  it("skips a pinned entry whose segment is absent", () => {
    const plans = planVehicles([
      route("east-west", [
        segment("east-west-turkey", [
          [40, 30],
          [41, 29],
        ]),
      ]),
    ]);

    expect(plans.map((plan) => plan.key)).toEqual([
      "east-west:east-west-turkey",
    ]);
  });

  it("skips a pinned entry whose geometry is degenerate", () => {
    const plans = planVehicles([
      route("east-west", [
        segment("east-west-btk", [stopCoordinate("baku-port")]),
      ]),
    ]);

    expect(plans).toEqual([]);
  });

  it("drops zero-length segments instead of animating them", () => {
    const plans = planVehicles([
      route("south-west", [
        segment("flat", [
          [40, 10],
          [40, 10],
        ]),
      ]),
    ]);

    expect(plans).toEqual([]);
  });
});
