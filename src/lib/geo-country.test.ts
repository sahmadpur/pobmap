import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";

import { findCountryIsoAtPoint, isPointInPolygon, isPointInRing } from "@/lib/geo-country";

const square: number[][] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
];

describe("isPointInRing", () => {
  it("accepts an interior point and rejects an exterior one", () => {
    expect(isPointInRing([5, 5], square)).toBe(true);
    expect(isPointInRing([15, 5], square)).toBe(false);
  });
});

describe("isPointInPolygon", () => {
  it("excludes points inside a hole", () => {
    const hole = [
      [4, 4],
      [6, 4],
      [6, 6],
      [4, 6],
      [4, 4],
    ];

    expect(isPointInPolygon([5, 5], [square, hole])).toBe(false);
    expect(isPointInPolygon([2, 2], [square, hole])).toBe(true);
  });
});

describe("findCountryIsoAtPoint", () => {
  const countries: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { iso: "AA" },
        geometry: { type: "Polygon", coordinates: [square] },
      },
      {
        type: "Feature",
        properties: { iso: "BB" },
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [20, 20],
                [30, 20],
                [30, 30],
                [20, 30],
                [20, 20],
              ],
            ],
          ],
        },
      },
    ],
  };

  it("resolves lat/lng points to the feature's iso", () => {
    // Coordinates are [lat, lng]; the ring above is [lng, lat].
    expect(findCountryIsoAtPoint(countries, [5, 5])).toBe("AA");
    expect(findCountryIsoAtPoint(countries, [25, 25])).toBe("BB");
    expect(findCountryIsoAtPoint(countries, [50, 50])).toBeNull();
    expect(findCountryIsoAtPoint(null, [5, 5])).toBeNull();
  });
});
