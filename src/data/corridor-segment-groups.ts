import { getTransportStop } from "@/data/transport-stops";
import type { CorridorRoute, CorridorSegment, LocalizedText } from "@/types/map";

/**
 * Presentation-only grouping of a corridor's segments, shown in the route
 * details panel. Static like CORRIDOR_KEY_COUNTRIES in @/data/corridors — it
 * describes how the corridor is narrated, not what it is made of, so it is not
 * part of the admin-editable store.
 */
export interface CorridorSegmentGroup {
  id: string;
  name: LocalizedText;
  /** ISO-2 codes of the stops this group claims. */
  countries: string[];
  /** Segments claimed by id, ahead of the country rule. */
  segmentIds?: string[];
}

/** Every European country the corridors currently reach. */
const EUROPE = [
  "UA", "MD", "RO", "BG", "RS", "HU", "SK", "CZ", "AT", "PL", "DE", "NL",
  "BE", "LU", "CH", "FR", "GB", "IT", "SI", "ES", "PT", "FI", "EE", "LV",
  "LT", "BY", "GR", "HR", "SE", "NO", "DK", "IE",
];

/**
 * Group order matters twice: it is the reading order in the panel, and a
 * segment joins the first group that claims any of its stops. That is what
 * keeps the Aktau-Baku crossing in Central Asia rather than in Az-Ge-Tr.
 * `segmentIds` overrides the country rule for segments that would otherwise
 * land in the wrong group, e.g. BTK leaving Baku still belongs to Ge-Tr.
 */
export const CORRIDOR_SEGMENT_GROUPS: Record<string, CorridorSegmentGroup[]> = {
  "east-west": [
    {
      id: "china",
      name: { az: "Çin", en: "China", ru: "Китай" },
      countries: ["CN", "VN"],
    },
    {
      id: "central-asia",
      name: { az: "Orta Asiya", en: "Central Asia", ru: "Центральная Азия" },
      countries: ["KZ", "KG", "UZ", "TJ", "TM", "AF"],
    },
    {
      id: "caucasus-turkey",
      name: { az: "Azərbaycan-Gürcüstan-Türkiyə", en: "Azerbaijan-Georgia-Türkiye", ru: "Азербайджан-Грузия-Турция" },
      countries: ["AZ", "GE", "TR"],
    },
    {
      id: "europe",
      name: { az: "Avropa", en: "Europe", ru: "Европа" },
      countries: EUROPE,
    },
  ],
  "north-west": [
    {
      id: "russia-azerbaijan",
      name: { az: "Rusiya-Azərbaycan", en: "Russia-Azerbaijan", ru: "Россия-Азербайджан" },
      countries: ["RU", "AZ"],
    },
    {
      id: "georgia-turkey",
      name: { az: "Gürcüstan-Türkiyə", en: "Georgia-Türkiye", ru: "Грузия-Турция" },
      countries: ["GE", "TR"],
      segmentIds: ["north-west-btk", "north-west-nakhchivan"],
    },
    {
      id: "europe",
      name: { az: "Avropa", en: "Europe", ru: "Европа" },
      countries: EUROPE,
    },
  ],
  "south-west": [
    {
      id: "europe",
      name: { az: "Avropa", en: "Europe", ru: "Европа" },
      countries: EUROPE,
    },
    {
      id: "caucasus-turkey",
      name: { az: "Türkiyə-Gürcüstan-Azərbaycan", en: "Türkiye-Georgia-Azerbaijan", ru: "Турция-Грузия-Азербайджан" },
      countries: ["TR", "GE", "AZ"],
    },
    {
      id: "gulf",
      name: { az: "Körfəz ölkələri", en: "Gulf states", ru: "Страны Залива" },
      countries: ["IR", "KW", "QA", "AE", "OM"],
    },
    {
      id: "pakistan-india",
      name: { az: "Pakistan-Hindistan", en: "Pakistan-India", ru: "Пакистан-Индия" },
      countries: ["PK", "IN"],
    },
  ],
  "north-south": [
    {
      id: "russia-azerbaijan-iran",
      name: { az: "Rusiya-Azərbaycan-İran", en: "Russia-Azerbaijan-Iran", ru: "Россия-Азербайджан-Иран" },
      countries: ["RU", "AZ", "IR"],
    },
    {
      id: "gulf-india",
      name: { az: "Körfəz-Hindistan", en: "Gulf-India", ru: "Залив-Индия" },
      countries: ["KW", "QA", "AE", "OM", "PK", "IN"],
    },
  ],
};

/** ISO-2 codes of the countries a segment passes through, in stop order, deduped. */
export function segmentCountries(segment: CorridorSegment): string[] {
  return Array.from(
    new Set(
      (segment.stopIds ?? [])
        .map((stopId) => getTransportStop(stopId)?.countryCode)
        .filter((code): code is string => Boolean(code)),
    ),
  );
}

export interface ResolvedSegmentGroup {
  id: string;
  name: LocalizedText;
  segments: CorridorSegment[];
}

/**
 * Splits a corridor's segments into its groups, in group order, dropping empty
 * ones. Segments no group claims fall into a trailing bucket keyed `other`, so
 * the panel can name it from the locale files rather than hiding the segments.
 *
 * Returns an empty array for corridors with no grouping (Zangezur), which the
 * panel reads as "render the flat list".
 */
export function resolveSegmentGroups(route: CorridorRoute): ResolvedSegmentGroup[] {
  const groups = CORRIDOR_SEGMENT_GROUPS[route.id];

  if (!groups) {
    return [];
  }

  const buckets = new Map<string, CorridorSegment[]>();
  const ungrouped: CorridorSegment[] = [];

  for (const segment of route.segments) {
    const countries = segmentCountries(segment);
    const owner =
      groups.find((group) => group.segmentIds?.includes(segment.id)) ??
      groups.find((group) =>
        countries.some((code) => group.countries.includes(code)),
      );

    if (!owner) {
      ungrouped.push(segment);
      continue;
    }

    const bucket = buckets.get(owner.id);

    if (bucket) {
      bucket.push(segment);
    } else {
      buckets.set(owner.id, [segment]);
    }
  }

  const resolved: ResolvedSegmentGroup[] = groups
    .filter((group) => buckets.has(group.id))
    .map((group) => ({
      id: group.id,
      name: group.name,
      segments: buckets.get(group.id)!,
    }));

  if (ungrouped.length > 0) {
    resolved.push({
      id: "other",
      name: { az: "Digər", en: "Other", ru: "Прочее" },
      segments: ungrouped,
    });
  }

  return resolved;
}
