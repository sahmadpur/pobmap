import { describe, expect, it } from "vitest";

import { collectRouteTerminalStopIds } from "@/lib/corridor-stop-utils";
import type { CorridorRoute, CorridorSegment, TransportMode } from "@/types/map";

function segment(id: string, stopIds: string[], mode: TransportMode = "rail"): CorridorSegment {
  const text = { az: id, en: id, ru: id };

  return {
    id,
    mode,
    from: text,
    to: text,
    distanceKm: 100,
    coordinates: stopIds.map((_, index) => [index, index] as [number, number]),
    stopIds,
  };
}

function route(segments: CorridorSegment[]): CorridorRoute {
  const text = { az: "r", en: "r", ru: "r" };

  return {
    id: "route",
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

describe("collectRouteTerminalStopIds", () => {
  it("returns both ends of a single segment", () => {
    const terminals = collectRouteTerminalStopIds(route([segment("s1", ["a", "b"])]));

    expect(terminals.sort()).toEqual(["a", "b"]);
  });

  it("treats interior stops of a segment as pass-through", () => {
    const terminals = collectRouteTerminalStopIds(
      route([segment("s1", ["a", "b", "c"])]),
    );

    expect(terminals.sort()).toEqual(["a", "c"]);
  });

  it("joins segments that share a stop", () => {
    const terminals = collectRouteTerminalStopIds(
      route([segment("s1", ["a", "b"]), segment("s2", ["b", "c"])]),
    );

    expect(terminals.sort()).toEqual(["a", "c"]);
  });

  it("reports every branch end of a forked corridor", () => {
    // hub -> x, hub -> y, hub -> z
    const terminals = collectRouteTerminalStopIds(
      route([
        segment("s1", ["hub", "x"]),
        segment("s2", ["hub", "y"]),
        segment("s3", ["hub", "z"]),
      ]),
    );

    expect(terminals.sort()).toEqual(["x", "y", "z"]);
  });

  it("excludes a junction that is only an endpoint of one segment", () => {
    // This is the Tbilisi case: interior to one segment, endpoint of another.
    const terminals = collectRouteTerminalStopIds(
      route([
        segment("s1", ["baku", "tbilisi", "kars"]),
        segment("s2", ["tbilisi", "batumi"]),
      ]),
    );

    expect(terminals).not.toContain("tbilisi");
    expect(terminals.sort()).toEqual(["baku", "batumi", "kars"]);
  });

  it("ignores repeated stops", () => {
    const terminals = collectRouteTerminalStopIds(
      route([segment("s1", ["a", "a", "b"])]),
    );

    expect(terminals.sort()).toEqual(["a", "b"]);
  });

  it("returns nothing for a route with no stop ids", () => {
    const bare = segment("s1", []);

    expect(collectRouteTerminalStopIds(route([bare]))).toEqual([]);
  });

  it("finds no terminal in a closed loop", () => {
    // Every stop has two neighbours, so the corridor has no gateway.
    const terminals = collectRouteTerminalStopIds(
      route([
        segment("s1", ["a", "b"]),
        segment("s2", ["b", "c"]),
        segment("s3", ["c", "a"]),
      ]),
    );

    expect(terminals).toEqual([]);
  });
});
