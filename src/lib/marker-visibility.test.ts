import { describe, expect, it } from "vitest";

import { getMarkerTier, isMarkerVisibleAtZoom, MARKER_MIN_ZOOM } from "@/lib/marker-visibility";
import type { AdminMarker, MarkerCategory } from "@/types/admin";
import type { Coordinate } from "@/types/map";

function marker(
  id: string,
  category: MarkerCategory,
  coordinates: Coordinate = [0, 0],
  corridorTiers?: AdminMarker["corridorTiers"],
): AdminMarker {
  const text = { az: id, en: id, ru: id };

  return {
    id,
    name: text,
    description: text,
    category,
    icon: "anchor",
    coordinates,
    connectedCorridorIds: [],
    corridorTiers,
  };
}

describe("getMarkerTier", () => {
  it("always ranks the Baku Port hub as major", () => {
    // Even with no active corridors and no overrides, the hub anchors the map.
    expect(getMarkerTier(marker("baku-port", "port"))).toBe("major");
  });

  it("ranks a marker with no corridorTiers as standard, however many corridors it serves", () => {
    // There is no heuristic promotion — an unmarked marker never counts as
    // "main" just because it happens to sit on several corridors, since that
    // is exactly what buried the map in overlapping always-on pins.
    const junction = marker("some-junction", "port");

    expect(getMarkerTier(junction, ["east-west", "north-west", "south-west"])).toBe(
      "standard",
    );
  });

  it("promotes a marker to major only where its corridorTiers says so", () => {
    const tbilisi = marker("tbilisi-intermodal-hub", "station", [0, 0], {
      "east-west": "major",
      "north-west": "major",
      "south-west": "major",
    });

    expect(getMarkerTier(tbilisi, ["east-west"])).toBe("major");
  });

  it("lets a corridor override make a marker major on one corridor and standard on another", () => {
    const aktau = marker("aktau-seaport", "port", [0, 0], {
      "east-west": "major",
      "north-west": "standard",
    });

    expect(getMarkerTier(aktau, ["east-west"])).toBe("major");
    expect(getMarkerTier(aktau, ["north-west"])).toBe("standard");
  });

  it("prefers major when several active corridors disagree", () => {
    const aktau = marker("aktau-seaport", "port", [0, 0], {
      "east-west": "major",
      "north-west": "standard",
    });

    expect(getMarkerTier(aktau, ["north-west", "east-west"])).toBe("major");
  });

  it("stays standard when no active corridor has a major override", () => {
    const moscow = marker("moscow-freight-hub", "station", [0, 0], {
      "north-west": "major",
    });

    expect(getMarkerTier(moscow, ["north-south"])).toBe("standard");
  });

  it("stays standard when the marker has no corridorTiers at all", () => {
    expect(getMarkerTier(marker("minsk-hub", "station"), ["north-south"])).toBe(
      "standard",
    );
  });
});

describe("isMarkerVisibleAtZoom", () => {
  const major = marker("aktau-seaport", "port", [0, 0], { "east-west": "major" });
  const standard = marker("minsk-hub", "station");

  it("shows major markers at every zoom the map allows", () => {
    // The map is clamped to zoom 3-7.
    [3, 4, 5, 6, 7].forEach((zoom) => {
      expect(isMarkerVisibleAtZoom(major, zoom, ["east-west"])).toBe(true);
    });
  });

  it("hides standard markers below the standard tier", () => {
    expect(isMarkerVisibleAtZoom(standard, 3)).toBe(false);
    expect(isMarkerVisibleAtZoom(standard, 4)).toBe(false);
  });

  it("shows standard markers from the standard tier upward", () => {
    expect(isMarkerVisibleAtZoom(standard, 5)).toBe(true);
    expect(isMarkerVisibleAtZoom(standard, 6)).toBe(true);
  });
});

describe("MARKER_MIN_ZOOM", () => {
  it("reveals detail in tiers as zoom increases", () => {
    expect(MARKER_MIN_ZOOM.major).toBeLessThan(MARKER_MIN_ZOOM.standard);
    expect(MARKER_MIN_ZOOM.standard).toBeLessThan(MARKER_MIN_ZOOM.stop);
  });
});
