import type { SupportedLocale } from "@/types/map";

export type Basemap = "default" | "styled";

/** Pickable in light theme; dark theme always uses the night palette. */
export const BASEMAPS: Basemap[] = ["default", "styled"];

// Google map tiles with every label hidden except country names, compiled to
// the tile endpoint's `apistyle` encoding: rules are comma-separated,
// `s.t:17` = administrative.country (5 landscape, 49 highway, 6 water),
// `s.e` = element (l labels, l.t labels.text, g geometry, g.s geometry.stroke),
// `p.v` = visibility, `p.c` = color aarrggbb. `|` is pre-URL-encoded.
const COUNTRIES_ONLY = ["s.e:l%7Cp.v:off", "s.t:17%7Cs.e:l.t%7Cp.v:on"];

export const BASEMAP_APISTYLE: Record<Basemap | "dark", string> = {
  default: COUNTRIES_ONLY.join(","),
  // Grey labels, cream landscape, light roads, blue water.
  styled: [
    ...COUNTRIES_ONLY,
    "s.t:17%7Cs.e:l.t.f%7Cp.c:%23ff878787",
    "s.t:17%7Cs.e:l.t.s%7Cp.v:off",
    "s.t:5%7Cp.c:%23fff9f5ed",
    "s.t:49%7Cp.c:%23fff5f5f5",
    "s.t:49%7Cs.e:g.s%7Cp.c:%23ffc9c9c9",
    "s.t:6%7Cp.c:%23ffaee0f4",
  ].join(","),
  // Google's night palette: slate land, darker water and roads, muted labels.
  dark: [
    ...COUNTRIES_ONLY,
    "s.e:g%7Cp.c:%23ff242f3e",
    "s.t:17%7Cs.e:l.t.f%7Cp.c:%23ff9aa5b4",
    "s.t:17%7Cs.e:l.t.s%7Cp.c:%23ff242f3e",
    "s.t:49%7Cs.e:g%7Cp.c:%23ff38414e",
    "s.t:49%7Cs.e:g.s%7Cp.c:%23ff212a37",
    "s.t:6%7Cs.e:g%7Cp.c:%23ff17263c",
  ].join(","),
};

export function basemapTileUrl(basemap: Basemap | "dark", locale: SupportedLocale) {
  return `https://mt{s}.google.com/vt/lyrs=m&hl=${locale}&x={x}&y={y}&z={z}&apistyle=${BASEMAP_APISTYLE[basemap]}`;
}

/** One real tile over the Caspian (z5) as the selector thumbnail. */
export function basemapPreviewUrl(basemap: Basemap, locale: SupportedLocale) {
  return basemapTileUrl(basemap, locale)
    .replace("{s}", "0")
    .replace("{x}", "20")
    .replace("{y}", "12")
    .replace("{z}", "5");
}
