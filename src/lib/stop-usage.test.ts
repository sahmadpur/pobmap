import { describe, expect, it } from "vitest";

import { describeStopUsage, findStopUsage } from "@/lib/stop-usage";
import type { CorridorRoute, CorridorSegment } from "@/types/map";

function text(value: string) {
  return { az: value, en: value, ru: value };
}

function segment(id: string, from: string, to: string, stopIds: string[]): CorridorSegment {
  return {
    id,
    mode: "rail",
    from: text(from),
    to: text(to),
    distanceKm: 100,
    coordinates: stopIds.map((_, index) => [index, index] as [number, number]),
    stopIds,
  };
}

function route(id: string, name: string, segments: CorridorSegment[]): CorridorRoute {
  return {
    id,
    name: text(name),
    routeColor: "#000000",
    type: "primary",
    totalDistanceKm: 100,
    transitTime: text("1 day"),
    countries: [],
    description: text(""),
    status: "active",
    animationSpeed: 1,
    segments,
  };
}

const routes = [
  route("east-west", "East-West Corridor", [
    segment("a", "Balkhash", "Sayak", ["balkhash", "sayak"]),
    segment("b", "Sayak", "Aktogay", ["sayak", "aktogay"]),
  ]),
  route("north-south", "North-South Corridor", [
    segment("c", "Baku", "Astara", ["baku", "astara"]),
  ]),
];

describe("findStopUsage", () => {
  it("lists every leg that passes through the stop, with its 1-based number", () => {
    expect(findStopUsage(routes, "sayak")).toEqual([
      { routeId: "east-west", routeName: "East-West Corridor", legs: ["#1 Balkhash → Sayak", "#2 Sayak → Aktogay"] },
    ]);
  });

  it("is empty for an unused stop", () => {
    expect(findStopUsage(routes, "nowhere")).toEqual([]);
  });
});

describe("describeStopUsage", () => {
  it("names the corridor and the legs", () => {
    expect(describeStopUsage(findStopUsage(routes, "aktogay"))).toBe(
      "East-West Corridor (leg #2 Sayak → Aktogay)",
    );
    expect(describeStopUsage(findStopUsage(routes, "sayak"))).toBe(
      "East-West Corridor (legs #1 Balkhash → Sayak, #2 Sayak → Aktogay)",
    );
  });
});
