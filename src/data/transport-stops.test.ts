import { afterEach, describe, expect, it } from "vitest";

import {
  getAllTransportStops,
  getStopForMarker,
  getTransportStop,
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
