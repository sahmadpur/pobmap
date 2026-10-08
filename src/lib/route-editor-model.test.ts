import { describe, expect, it } from "vitest";

import { getTransportStop, registerTransportStops } from "@/data/transport-stops";
import {
  createHistory,
  detachStopFromRoutes,
  haversineKm,
  nearestInsertionIndex,
  pathLengthKm,
  pushHistory,
  redoHistory,
  segmentToVertices,
  slugifyStopId,
  undoHistory,
  validateVertices,
  verticesToSegment,
  verticesToStopIds,
} from "@/lib/route-editor-model";
import type { CorridorRoute, CorridorSegment } from "@/types/map";

function stop(stopId: string) {
  const found = getTransportStop(stopId);

  if (!found) {
    throw new Error(`unknown stop ${stopId}`);
  }

  return found;
}

function makeSegment(overrides: Partial<CorridorSegment>): CorridorSegment {
  return {
    id: "leg",
    mode: "rail",
    from: { az: "", en: "", ru: "" },
    to: { az: "", en: "", ru: "" },
    distanceKm: 0,
    coordinates: [],
    ...overrides,
  };
}

describe("segmentToVertices", () => {
  it("pins first and last stops to the line ends and bends in between stay free", () => {
    const baku = stop("baku-port");
    const tbilisi = stop("tbilisi");
    const segment = makeSegment({
      stopIds: ["baku-port", "tbilisi"],
      coordinates: [baku.coordinates, tbilisi.coordinates],
      displayCoordinates: [
        [40.36, 49.83],
        [41.2, 47.5],
        [41.71, 44.83],
      ],
    });

    const vertices = segmentToVertices(segment);

    expect(vertices).toHaveLength(3);
    expect(vertices[0]).toEqual({ coordinate: baku.coordinates, stopId: "baku-port" });
    expect(vertices[1]).toEqual({ coordinate: [41.2, 47.5], stopId: null });
    expect(vertices[2]).toEqual({ coordinate: tbilisi.coordinates, stopId: "tbilisi" });
  });

  it("anchors an intermediate stop to its nearest vertex", () => {
    const baku = stop("baku-port");
    const tbilisi = stop("tbilisi");
    const kars = stop("kars");
    const segment = makeSegment({
      stopIds: ["baku-port", "tbilisi", "kars"],
      coordinates: [baku.coordinates, tbilisi.coordinates, kars.coordinates],
      displayCoordinates: [
        baku.coordinates,
        [41.3, 47.2],
        [41.7, 44.85],
        [40.9, 43.5],
        kars.coordinates,
      ],
    });

    const vertices = segmentToVertices(segment);

    expect(vertices.map((vertex) => vertex.stopId)).toEqual([
      "baku-port",
      null,
      "tbilisi",
      null,
      "kars",
    ]);
    expect(vertices[2].coordinate).toEqual(tbilisi.coordinates);
  });

  it("recognises catalog cities in coordinate-only legacy segments", () => {
    const baku = stop("baku-port");
    const tbilisi = stop("tbilisi");
    const vertices = segmentToVertices(
      makeSegment({ coordinates: [baku.coordinates, [41.2, 47.5], tbilisi.coordinates] }),
    );

    expect(verticesToStopIds(vertices)).toEqual(["baku-port", "tbilisi"]);
  });

  it("sees custom cities once registered", () => {
    registerTransportStops([
      {
        id: "test-city",
        name: { az: "Test", en: "Test", ru: "Тест" },
        countryCode: "AZ",
        coordinates: [40.5, 48.5],
      },
    ]);

    const vertices = segmentToVertices(
      makeSegment({
        stopIds: ["baku-port", "test-city"],
        coordinates: [stop("baku-port").coordinates, [40.5, 48.5]],
      }),
    );

    expect(vertices[1].stopId).toBe("test-city");
    registerTransportStops([]);
  });
});

describe("verticesToSegment", () => {
  it("rebuilds stop ids, coordinates and labels from the vertices", () => {
    const baku = stop("baku-port");
    const tbilisi = stop("tbilisi");
    const next = verticesToSegment(makeSegment({}), [
      { coordinate: baku.coordinates, stopId: "baku-port" },
      { coordinate: [41.2, 47.5], stopId: null },
      { coordinate: tbilisi.coordinates, stopId: "tbilisi" },
    ]);

    expect(next.stopIds).toEqual(["baku-port", "tbilisi"]);
    expect(next.coordinates).toEqual([baku.coordinates, tbilisi.coordinates]);
    expect(next.displayCoordinates).toHaveLength(3);
    expect(next.from).toEqual(baku.name);
    expect(next.to).toEqual(tbilisi.name);
  });

  it("keeps a hand-written label while the end city is unchanged", () => {
    const baku = stop("baku-port");
    const tbilisi = stop("tbilisi");
    const custom = { az: "Ələt", en: "Alat", ru: "Алят" };
    const next = verticesToSegment(
      makeSegment({ stopIds: ["baku-port", "tbilisi"], from: custom }),
      [
        { coordinate: baku.coordinates, stopId: "baku-port" },
        { coordinate: tbilisi.coordinates, stopId: "tbilisi" },
      ],
    );

    expect(next.from).toEqual(custom);
  });
});

describe("validateVertices", () => {
  it("requires city ends and two distinct cities", () => {
    const baku = stop("baku-port");

    expect(validateVertices([])).toEqual(["A leg needs at least two points."]);
    expect(
      validateVertices([
        { coordinate: baku.coordinates, stopId: "baku-port" },
        { coordinate: [41, 47], stopId: null },
      ]),
    ).toEqual(["The leg must end on a city."]);
    expect(
      validateVertices([
        { coordinate: baku.coordinates, stopId: "baku-port" },
        { coordinate: [41, 47], stopId: null },
        { coordinate: baku.coordinates, stopId: "baku-port" },
      ]),
    ).toEqual(["The leg starts and ends on the same city."]);
  });
});

describe("distances", () => {
  it("measures Baku to Tbilisi at roughly 450 km", () => {
    const km = haversineKm(stop("baku-port").coordinates, stop("tbilisi").coordinates);

    expect(km).toBeGreaterThan(420);
    expect(km).toBeLessThan(480);
    expect(pathLengthKm([stop("baku-port").coordinates, stop("tbilisi").coordinates])).toBe(
      Math.round(km),
    );
  });
});

describe("nearestInsertionIndex", () => {
  it("splices after the vertex that starts the closest edge", () => {
    const line: Array<[number, number]> = [
      [0, 0],
      [10, 0],
      [10, 10],
    ];

    expect(nearestInsertionIndex(line, [5, 1])).toBe(1);
    expect(nearestInsertionIndex(line, [9, 5])).toBe(2);
  });
});

describe("slugifyStopId", () => {
  it("strips diacritics and Azerbaijani letters", () => {
    expect(slugifyStopId("Bandar-e Anzali")).toBe("bandar-e-anzali");
    expect(slugifyStopId("Şəmkir")).toBe("semkir");
    expect(slugifyStopId("  Ağstafa ")).toBe("agstafa");
  });
});

describe("history", () => {
  it("undoes and redoes in order and drops the future on a new push", () => {
    let history = createHistory(1);
    history = pushHistory(history, 2);
    history = pushHistory(history, 3);

    history = undoHistory(history);
    expect(history.present).toBe(2);

    history = redoHistory(history);
    expect(history.present).toBe(3);

    history = undoHistory(history);
    history = pushHistory(history, 4);
    expect(history.present).toBe(4);
    expect(history.future).toEqual([]);
    expect(redoHistory(history)).toBe(history);
  });
});

describe("detachStopFromRoutes", () => {
  const vienna = () => stop("vienna").coordinates;
  const prague = () => stop("prague").coordinates;
  const berlin = () => stop("berlin").coordinates;
  const bend: [number, number] = [51, 14];

  function corridor(segments: CorridorSegment[]): CorridorRoute {
    return {
      id: "nw",
      name: { az: "NW", en: "NW", ru: "NW" },
      routeColor: "#000",
      type: "primary",
      totalDistanceKm: 0,
      transitTime: { az: "", en: "", ru: "" },
      countries: [],
      description: { az: "", en: "", ru: "" },
      status: "active",
      animationSpeed: 1,
      segments,
    };
  }

  it("shortens a leg that ends on the city to the previous city", () => {
    const leg = makeSegment({
      id: "vienna-berlin",
      from: stop("vienna").name,
      to: stop("berlin").name,
      stopIds: ["vienna", "prague", "berlin"],
      displayCoordinates: [vienna(), prague(), bend, berlin()],
      distanceKm: 600,
    });

    const { routes, removedLegs } = detachStopFromRoutes([corridor([leg])], "berlin");
    const shortened = routes[0].segments[0];

    expect(removedLegs).toEqual([]);
    expect(shortened.stopIds).toEqual(["vienna", "prague"]);
    expect(shortened.displayCoordinates).toEqual([vienna(), prague()]);
    expect(shortened.to.en).toBe(stop("prague").name.en);
    expect(shortened.distanceKm).toBe(pathLengthKm([vienna(), prague()]));
  });

  it("shortens a leg that starts on the city to the next city", () => {
    const leg = makeSegment({
      stopIds: ["berlin", "prague", "vienna"],
      displayCoordinates: [berlin(), bend, prague(), vienna()],
    });

    const shortened = detachStopFromRoutes([corridor([leg])], "berlin").routes[0].segments[0];

    expect(shortened.stopIds).toEqual(["prague", "vienna"]);
    expect(shortened.displayCoordinates).toEqual([prague(), vienna()]);
  });

  it("keeps the line through a city in the middle of a leg as a plain bend", () => {
    const leg = makeSegment({
      stopIds: ["vienna", "prague", "berlin"],
      displayCoordinates: [vienna(), prague(), berlin()],
      distanceKm: 600,
    });

    const kept = detachStopFromRoutes([corridor([leg])], "prague").routes[0].segments[0];

    expect(kept.stopIds).toEqual(["vienna", "berlin"]);
    expect(kept.displayCoordinates).toEqual([vienna(), prague(), berlin()]);
    expect(kept.distanceKm).toBe(600);
  });

  it("removes a leg left with a single city and reports it", () => {
    const leg = makeSegment({
      id: "prague-berlin",
      from: stop("prague").name,
      to: stop("berlin").name,
      stopIds: ["prague", "berlin"],
      displayCoordinates: [prague(), berlin()],
    });
    const other = makeSegment({ id: "other", stopIds: ["vienna", "prague"] });

    const { routes, removedLegs } = detachStopFromRoutes([corridor([leg, other])], "berlin");

    expect(routes[0].segments.map((segment) => segment.id)).toEqual(["other"]);
    expect(removedLegs).toEqual([{ routeId: "nw", segmentId: "prague-berlin" }]);
  });

  it("returns only the corridors it changed", () => {
    const untouched = corridor([makeSegment({ stopIds: ["vienna", "prague"] })]);

    expect(detachStopFromRoutes([untouched], "berlin").routes).toEqual([]);
  });
});
