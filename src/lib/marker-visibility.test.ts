import { describe, expect, it } from "vitest";

import {
  getMarkerTier,
  isMarkerVisibleAtZoom,
  MARKER_MIN_ZOOM,
} from "@/lib/marker-visibility";
import type { AdminMarker, MarkerCategory } from "@/types/admin";
import type { Coordinate } from "@/types/map";

function marker(
  id: string,
  category: MarkerCategory,
  coordinates: Coordinate = [0, 0],
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
  };
}

describe("getMarkerTier", () => {
  it("always ranks the Baku Port hub as major", () => {
    // Even with no corridors resolved, the hub anchors the map.
    expect(getMarkerTier(marker("baku-port", "port"), 0)).toBe("major");
  });

  it("ranks any marker serving three or more corridors as major", () => {
    expect(getMarkerTier(marker("tbilisi-intermodal-hub", "station"), 3)).toBe(
      "major",
    );
  });

  it("ranks a port serving two corridors as major", () => {
    expect(getMarkerTier(marker("aktau-seaport", "port"), 2)).toBe("major");
  });

  it("ranks a station serving two corridors as standard", () => {
    // Inland stations need a third corridor to graduate; ports do not.
    expect(getMarkerTier(marker("moscow-freight-hub", "station"), 2)).toBe(
      "standard",
    );
  });

  it("ranks a single-corridor port as standard", () => {
    expect(getMarkerTier(marker("riga-port", "port"), 1)).toBe("standard");
  });

  it("ranks a single-corridor station as standard", () => {
    expect(getMarkerTier(marker("minsk-hub", "station"), 1)).toBe("standard");
  });
});

describe("isMarkerVisibleAtZoom", () => {
  const major = marker("aktau-seaport", "port");
  const standard = marker("minsk-hub", "station");

  it("shows major markers at every zoom the map allows", () => {
    // The map is clamped to zoom 3-7.
    [3, 4, 5, 6, 7].forEach((zoom) => {
      expect(isMarkerVisibleAtZoom(major, 2, zoom)).toBe(true);
    });
  });

  it("hides standard markers below the standard tier", () => {
    expect(isMarkerVisibleAtZoom(standard, 1, 3)).toBe(false);
    expect(isMarkerVisibleAtZoom(standard, 1, 4)).toBe(false);
  });

  it("shows standard markers from the standard tier upward", () => {
    expect(isMarkerVisibleAtZoom(standard, 1, 5)).toBe(true);
    expect(isMarkerVisibleAtZoom(standard, 1, 6)).toBe(true);
  });
});

describe("MARKER_MIN_ZOOM", () => {
  it("reveals detail in tiers as zoom increases", () => {
    expect(MARKER_MIN_ZOOM.major).toBeLessThan(MARKER_MIN_ZOOM.standard);
    expect(MARKER_MIN_ZOOM.standard).toBeLessThan(MARKER_MIN_ZOOM.stop);
  });
});
