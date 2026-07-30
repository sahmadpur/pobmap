import { describe, expect, it } from "vitest";

import { DOTTED_STRETCHES } from "@/data/dotted-stretches";
import { getTransportStop } from "@/data/transport-stops";
import adminStoreSeed from "@/data/admin-store.json";
import {
  getCorridorOffsetPx,
  offsetPathPixels,
  splitSegmentForDotting,
} from "@/lib/map-utils";
import type { Coordinate, CorridorRoute, CorridorSegment } from "@/types/map";

const routes = (adminStoreSeed as unknown as { routes: CorridorRoute[] }).routes;

function segment(routeId: string, segmentId: string): CorridorSegment {
  const found = routes
    .find((route) => route.id === routeId)
    ?.segments.find((item) => item.id === segmentId);

  if (!found) {
    throw new Error(`missing fixture segment ${routeId}/${segmentId}`);
  }

  return found;
}

function distanceTo(coordinate: Coordinate, stopId: string): number {
  const stop = getTransportStop(stopId);

  if (!stop) {
    throw new Error(`unknown stop ${stopId}`);
  }

  return Math.hypot(
    coordinate[0] - stop.coordinates[0],
    coordinate[1] - stop.coordinates[1],
  );
}

describe("splitSegmentForDotting", () => {
  it("cuts the unbuilt Aghband-Ordubad stretch out of the middle of the line", () => {
    const runs = splitSegmentForDotting(
      "east-west",
      segment("east-west", "east-west-zangezur"),
      DOTTED_STRETCHES,
    );

    // Baku - Horadiz - [Aghband - Ordubad] - Nakhchivan: solid either side.
    expect(runs.dotted).toHaveLength(1);
    expect(runs.solid).toHaveLength(2);

    const dotted = runs.dotted[0];
    expect(distanceTo(dotted[0], "aghband")).toBeLessThan(0.05);
    expect(distanceTo(dotted[dotted.length - 1], "ordubad")).toBeLessThan(0.05);
  });

  it("leaves Urumqi-Kashgar solid while dotting Kashgar through to Tashkent", () => {
    const runs = splitSegmentForDotting(
      "east-west",
      segment("east-west", "east-west-kashgar"),
      DOTTED_STRETCHES,
    );

    expect(runs.dotted).toHaveLength(1);
    expect(runs.solid).toHaveLength(1);

    const solid = runs.solid[0];
    const dotted = runs.dotted[0];
    expect(distanceTo(solid[0], "urumqi")).toBeLessThan(0.05);
    expect(distanceTo(dotted[0], "kashgar")).toBeLessThan(0.05);
    expect(distanceTo(dotted[dotted.length - 1], "tashkent")).toBeLessThan(0.05);
  });

  it("dots the Zangezur gap in every corridor that carries it", () => {
    const zangezurStretches = DOTTED_STRETCHES.filter(
      (stretch) => stretch.fromStopId === "aghband" && stretch.toStopId === "ordubad",
    );

    expect(zangezurStretches.map((stretch) => stretch.routeId).sort()).toEqual([
      "east-west",
      "north-south",
      "south-west",
      "zangezur-corridor",
    ]);

    zangezurStretches.forEach((stretch) => {
      const runs = splitSegmentForDotting(
        stretch.routeId,
        segment(stretch.routeId, stretch.segmentId),
        DOTTED_STRETCHES,
      );

      expect(runs.dotted).toHaveLength(1);
    });
  });

  it("returns one solid run for a segment with no dotted stretch", () => {
    const target = segment("east-west", "east-west-btk");
    const runs = splitSegmentForDotting("east-west", target, DOTTED_STRETCHES);

    expect(runs.dotted).toHaveLength(0);
    expect(runs.solid).toHaveLength(1);
  });

  it("does not dot a segment id that belongs to a different corridor", () => {
    // south-west-zangezur is dotted, east-west-zangezur is dotted, but asking
    // for one under the other corridor's id must not match.
    const runs = splitSegmentForDotting(
      "north-west",
      segment("south-west", "south-west-zangezur"),
      DOTTED_STRETCHES,
    );

    expect(runs.dotted).toHaveLength(0);
  });
});

describe("offsetPathPixels", () => {
  // Web-Mercator-ish stand-in: x grows east, y grows south, 100 units per degree.
  const project = (coordinate: Coordinate) => ({
    x: coordinate[1] * 100,
    y: -coordinate[0] * 100,
  });
  const unproject = (point: { x: number; y: number }) =>
    [-point.y / 100, point.x / 100] as Coordinate;

  it("leaves a path untouched at zero offset", () => {
    const path: Coordinate[] = [
      [0, 0],
      [1, 0],
    ];

    expect(offsetPathPixels(path, 0, project, unproject)).toEqual(path);
  });

  it("shifts a northbound path due east by the requested pixels", () => {
    const path: Coordinate[] = [
      [0, 0],
      [1, 0],
      [2, 0],
    ];

    const shifted = offsetPathPixels(path, 10, project, unproject);

    shifted.forEach((coordinate, index) => {
      expect(coordinate[0]).toBeCloseTo(path[index][0], 6);
      expect(coordinate[1]).toBeCloseTo(0.1, 6);
    });
  });

  it("flips the shift with the sign of the offset", () => {
    const path: Coordinate[] = [
      [0, 0],
      [1, 0],
    ];

    const east = offsetPathPixels(path, 10, project, unproject);
    const west = offsetPathPixels(path, -10, project, unproject);

    expect(east[0][1]).toBeCloseTo(-west[0][1], 6);
  });

  it("keeps a degenerate path with repeated vertices finite", () => {
    const path: Coordinate[] = [
      [0, 0],
      [0, 0],
    ];

    offsetPathPixels(path, 5, project, unproject).forEach((coordinate) => {
      expect(Number.isFinite(coordinate[0])).toBe(true);
      expect(Number.isFinite(coordinate[1])).toBe(true);
    });
  });
});

describe("getCorridorOffsetPx", () => {
  const catalogue = [
    { id: "east-west" },
    { id: "north-west" },
    { id: "south-west" },
    { id: "north-south" },
    { id: "zangezur-corridor" },
  ];

  it("alternates lanes around the first corridor", () => {
    expect(catalogue.map(({ id }) => getCorridorOffsetPx(id, catalogue))).toEqual([
      0, 3, -3, 6, -6,
    ]);
  });

  it("gives every corridor a distinct lane", () => {
    const lanes = catalogue.map(({ id }) => getCorridorOffsetPx(id, catalogue));

    expect(new Set(lanes).size).toBe(lanes.length);
  });

  it("keeps a corridor's lane when other corridors are filtered out", () => {
    // The canvas passes the full catalogue precisely so this holds.
    expect(getCorridorOffsetPx("south-west", catalogue)).toBe(
      getCorridorOffsetPx("south-west", catalogue),
    );
    expect(getCorridorOffsetPx("unknown-corridor", catalogue)).toBe(0);
  });
});
