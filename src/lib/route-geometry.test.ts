import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { Coordinate, CorridorRoute } from "@/types/map";

/**
 * Regression guards for the three corridor paths that stakeholders flagged as
 * geographically wrong.
 *
 * These assert only on the corrected segments, and only over the sub-paths that
 * were wrong. A blanket bounding-box sweep does not work here: Azerbaijan wraps
 * around Armenia, so any Armenia-shaped rectangle also contains Ganja, and the
 * Bohai Sea is concave enough that a rectangle over it also contains the coastal
 * rail cities the route is supposed to follow.
 */

const STORE_PATH = path.join(process.cwd(), "src/data/admin-store.json");

const store = JSON.parse(readFileSync(STORE_PATH, "utf8")) as {
  routes: CorridorRoute[];
};

function segmentPath(segmentId: string): Coordinate[] {
  for (const route of store.routes) {
    for (const segment of route.segments) {
      if (segment.id === segmentId) {
        const drawn = segment.displayCoordinates?.length
          ? segment.displayCoordinates
          : segment.coordinates;

        expect(drawn.length).toBeGreaterThan(1);

        return drawn;
      }
    }
  }

  throw new Error(`Segment not found in admin store: ${segmentId}`);
}

function includesPoint(
  drawn: Coordinate[],
  [lat, lng]: Coordinate,
  tolerance = 0.05,
): boolean {
  return drawn.some(
    (point) =>
      Math.abs(point[0] - lat) < tolerance && Math.abs(point[1] - lng) < tolerance,
  );
}

const TBILISI: Coordinate = [41.7151, 44.8271];

describe("Baku-Tbilisi-Kars crosses into Türkiye north-west of Armenia", () => {
  // east-west splits the line at Boyuk Kasik, so its Georgia->Türkiye tail
  // lives in the second half; the other corridors still carry it whole.
  const BTK_SEGMENTS = [
    "east-west-boyuk-kasik-kars",
    "north-west-btk",
    "south-west-turkey-alt",
  ];

  /**
   * Valid only for the Georgia->Türkiye tail. Over that stretch the line should
   * stay north of 41.3N (above Armenia) or west of 43.4E (beyond its western
   * border), so anything inside this box is on Armenian territory.
   */
  const ARMENIA_ON_THE_CROSSING = {
    minLat: 40.0,
    maxLat: 41.3,
    minLng: 43.4,
    maxLng: 45.0,
  };

  function crossingTail(segmentId: string): Coordinate[] {
    const drawn = segmentPath(segmentId);
    const tbilisiIndex = drawn.findIndex(
      (point) =>
        Math.abs(point[0] - TBILISI[0]) < 0.01 &&
        Math.abs(point[1] - TBILISI[1]) < 0.01,
    );

    expect(tbilisiIndex).toBeGreaterThanOrEqual(0);

    return drawn.slice(tbilisiIndex);
  }

  it.each(BTK_SEGMENTS)("%s keeps the crossing off Armenian territory", (segmentId) => {
    const offending = crossingTail(segmentId).filter(
      ([lat, lng]) =>
        lat >= ARMENIA_ON_THE_CROSSING.minLat &&
        lat <= ARMENIA_ON_THE_CROSSING.maxLat &&
        lng >= ARMENIA_ON_THE_CROSSING.minLng &&
        lng <= ARMENIA_ON_THE_CROSSING.maxLng,
    );

    expect(offending).toEqual([]);
  });

  it.each(BTK_SEGMENTS)("%s routes via Akhalkalaki and Kartsakhi", (segmentId) => {
    const tail = crossingTail(segmentId);

    // The real alignment leaves Georgia at the Kartsakhi/Türkgözü crossing.
    expect(includesPoint(tail, [41.4, 43.48])).toBe(true);
    expect(includesPoint(tail, [41.19, 43.13])).toBe(true);
  });
});

describe("Baku-Lankaran runs over land, not the Caspian", () => {
  const SEGMENT = "north-south-main-4";

  it("keeps the Azerbaijani and Iranian coastal legs off the water", () => {
    // Between Baku and Rasht the western Caspian shore never reaches past
    // ~49.45E, so any drawn point east of that is in open water.
    const offshore = segmentPath(SEGMENT).filter(
      ([lat, lng]) => lat < 40.2 && lat > 37.3 && lng > 49.45,
    );

    expect(offshore).toEqual([]);
  });

  it("passes through Lankaran on the way to Astara", () => {
    const drawn = segmentPath(SEGMENT);

    expect(includesPoint(drawn, [38.7529, 48.8475])).toBe(true);
    expect(drawn.findIndex((p) => Math.abs(p[0] - 38.7529) < 0.05)).toBeLessThan(
      drawn.findIndex((p) => Math.abs(p[0] - 38.4437) < 0.05),
    );
  });

  it("lists Lankaran as a stop so it gets a labelled dot", () => {
    const segment = store.routes
      .flatMap((route) => route.segments)
      .find((candidate) => candidate.id === SEGMENT);

    expect(segment?.stopIds).toContain("lankaran");
  });
});

describe("Dalian-Beijing runs over land, not the Bohai Sea", () => {
  const SEGMENT = "east-west-cn-dalian";

  it("no longer cuts across Liaodong Bay or Bohai Bay", () => {
    const drawn = segmentPath(SEGMENT);

    // The two waypoints that put the line in open water.
    expect(includesPoint(drawn, [40.1, 121.7], 0.01)).toBe(false);
    expect(includesPoint(drawn, [39.7, 119.0], 0.01)).toBe(false);
  });

  it("follows the coastal rail alignment around the gulf", () => {
    const drawn = segmentPath(SEGMENT);

    // Yingkou and Jinzhou carry the line around the head of Liaodong Bay;
    // Shanhaiguan and Tianjin carry it down the western shore.
    [
      [40.76, 122.41],
      [41.1, 121.13],
      [40.18, 119.6],
      [39.08, 117.2],
    ].forEach((city) => {
      expect(includesPoint(drawn, city as Coordinate)).toBe(true);
    });
  });
});
