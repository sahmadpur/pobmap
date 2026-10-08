import { afterEach, describe, expect, it } from "vitest";

import {
  getAllTransportStops,
  getMarkerIdForStop,
  getStopForMarker,
  getTransportStop,
  getTransportStopByCoordinate,
  registerTransportStops,
  searchTransportStops,
} from "@/data/transport-stops";

afterEach(() => registerTransportStops([]));

describe("registerTransportStops", () => {
  it("adds custom stops to every lookup", () => {
    registerTransportStops([
      {
        id: "my-city",
        name: { az: "Şəhər", en: "My City", ru: "Город" },
        countryCode: "AZ",
        coordinates: [40.1, 48.2],
      },
    ]);

    expect(getTransportStop("my-city")?.source).toBe("custom");
    expect(searchTransportStops("my city").map((stop) => stop.id)).toContain("my-city");
    expect(getAllTransportStops().some((stop) => stop.id === "my-city")).toBe(true);
  });

  it("turns a marker into a stop unless a stop already sits there", () => {
    const baku = getTransportStop("baku-port")!;
    registerTransportStops(
      [],
      [
        {
          id: "baku-port",
          name: baku.name,
          coordinates: baku.coordinates,
        },
        {
          id: "new-terminal",
          name: { az: "Terminal", en: "New Terminal", ru: "Терминал" },
          coordinates: [45.5, 60.5],
          countryCode: "KZ",
        },
      ],
    );

    // The Baku marker shares the catalog stop; it must not shadow it.
    expect(getTransportStop("baku-port")?.source).toBeUndefined();
    expect(getStopForMarker({ id: "baku-port", name: baku.name, coordinates: baku.coordinates })?.id).toBe(
      "baku-port",
    );

    const terminal = getTransportStop("new-terminal");
    expect(terminal?.source).toBe("marker");
    expect(terminal?.countryCode).toBe("KZ");
  });

  it("forgets marker stops on the next registration", () => {
    registerTransportStops([], [
      { id: "temp", name: { az: "T", en: "T", ru: "T" }, coordinates: [10, 10] },
    ]);
    expect(getTransportStop("temp")).not.toBeNull();

    registerTransportStops([]);
    expect(getTransportStop("temp")).toBeNull();
  });
});

describe("getMarkerIdForStop", () => {
  it("finds the marker a catalog stop stands for, by id or by position", () => {
    const tbilisi = getTransportStop("tbilisi")!;
    registerTransportStops([], [
      { id: "baku-port", name: getTransportStop("baku-port")!.name, coordinates: getTransportStop("baku-port")!.coordinates },
      { id: "tbilisi-hub", name: tbilisi.name, coordinates: [tbilisi.coordinates[0] + 0.001, tbilisi.coordinates[1]] },
      { id: "new-terminal", name: { az: "T", en: "T", ru: "T" }, coordinates: [45.5, 60.5] },
    ]);

    expect(getMarkerIdForStop("baku-port")).toBe("baku-port");
    expect(getMarkerIdForStop("tbilisi")).toBe("tbilisi-hub");
    expect(getMarkerIdForStop("new-terminal")).toBe("new-terminal");
    expect(getMarkerIdForStop("moscow")).toBeNull();
  });

  it("forgets the link on the next registration", () => {
    const tbilisi = getTransportStop("tbilisi")!;
    registerTransportStops([], [{ id: "tbilisi-hub", name: tbilisi.name, coordinates: tbilisi.coordinates }]);
    registerTransportStops([]);

    expect(getMarkerIdForStop("tbilisi")).toBeNull();
  });
});

describe("built-in city overrides", () => {
  it("applies a stored edit of a built-in city in place of the catalog entry", () => {
    registerTransportStops([
      {
        id: "berlin",
        name: { az: "Berlin", en: "Berlin Hbf", ru: "Берлин" },
        countryCode: "DE",
        coordinates: [52.525, 13.369],
      },
    ]);

    const berlin = getTransportStop("berlin");
    expect(berlin?.name.en).toBe("Berlin Hbf");
    expect(berlin?.coordinates).toEqual([52.525, 13.369]);
    // Still a built-in city, not a custom one.
    expect(berlin?.source).toBeUndefined();
    expect(getAllTransportStops().filter((stop) => stop.id === "berlin")).toHaveLength(1);
    expect(getTransportStopByCoordinate([52.525, 13.369])?.id).toBe("berlin");
    expect(getTransportStopByCoordinate([52.52, 13.405])).toBeNull();
  });

  it("drops a built-in city an admin deleted", () => {
    const warsaw = getTransportStop("warsaw")!;
    registerTransportStops([{ ...warsaw, hidden: true }]);

    expect(getTransportStop("warsaw")).toBeNull();
    expect(getAllTransportStops().some((stop) => stop.id === "warsaw")).toBe(false);
    expect(searchTransportStops("warsaw").map((stop) => stop.id)).not.toContain("warsaw");
  });

  it("restores the catalog entry once the override is gone", () => {
    registerTransportStops([{ ...getTransportStop("hamburg")!, hidden: true }]);
    registerTransportStops([]);

    expect(getTransportStop("hamburg")?.name.en).toBe("Hamburg");
  });
});
