import { describe, expect, it } from "vitest";

import { appSettingsSchema } from "@/lib/server/admin-schemas";

const VALID = {
  defaultMapCenter: [41, 49],
  defaultZoom: 4,
  minZoom: 3,
  maxZoom: 8,
  defaultLanguage: "az",
  animationEnabled: true,
};

describe("appSettingsSchema", () => {
  it("accepts the seed viewport", () => {
    expect(appSettingsSchema.safeParse(VALID).success).toBe(true);
  });

  it("coerces numeric strings from form inputs", () => {
    const parsed = appSettingsSchema.safeParse({
      ...VALID,
      minZoom: "2",
      maxZoom: "9",
      defaultMapCenter: ["40.5", "49.9"],
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.minZoom).toBe(2);
    expect(parsed.data?.defaultMapCenter).toEqual([40.5, 49.9]);
  });

  it("rejects min zoom above max zoom", () => {
    const parsed = appSettingsSchema.safeParse({ ...VALID, minZoom: 9, maxZoom: 8 });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toMatch(/min zoom/i);
  });

  it("rejects a default zoom outside the window", () => {
    expect(appSettingsSchema.safeParse({ ...VALID, defaultZoom: 2 }).success).toBe(false);
    expect(appSettingsSchema.safeParse({ ...VALID, defaultZoom: 9 }).success).toBe(false);
  });

  it("rejects zoom levels Leaflet cannot render", () => {
    expect(appSettingsSchema.safeParse({ ...VALID, minZoom: 0 }).success).toBe(false);
    expect(appSettingsSchema.safeParse({ ...VALID, maxZoom: 19 }).success).toBe(false);
    expect(appSettingsSchema.safeParse({ ...VALID, defaultZoom: 4.5 }).success).toBe(false);
  });
});
