import { describe, expect, it } from "vitest";

import { mergeSeedMarkers } from "@/lib/seed-markers-merge";
import type { AdminMarker } from "@/types/admin";

function marker(id: string, en = id): AdminMarker {
  return {
    id,
    name: { az: en, en, ru: en },
    description: { az: "", en: "", ru: "" },
    category: "port",
    icon: "fas:anchor",
    coordinates: [0, 0],
    connectedCorridorIds: [],
  };
}

describe("mergeSeedMarkers", () => {
  it("adds seed markers the store does not have yet and keeps stored edits", () => {
    const merged = mergeSeedMarkers([marker("a"), marker("b")], [marker("a", "Edited")], []);

    expect(merged.map((item) => item.id)).toEqual(["a", "b"]);
    expect(merged[0].name.en).toBe("Edited");
  });

  it("does not bring back a seed marker an admin deleted", () => {
    const merged = mergeSeedMarkers([marker("a"), marker("b")], [marker("a")], ["b"]);

    expect(merged.map((item) => item.id)).toEqual(["a"]);
  });
});
