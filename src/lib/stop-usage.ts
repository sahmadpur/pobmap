import type { CorridorRoute } from "@/types/map";

export interface StopUsage {
  routeId: string;
  routeName: string;
  /** "#<leg number> <from> → <to>", numbered like the editor's leg list. */
  legs: string[];
}

/** Every corridor leg that passes through the stop, grouped by corridor. */
export function findStopUsage(routes: CorridorRoute[], stopId: string): StopUsage[] {
  return routes.flatMap((route) => {
    const legs = route.segments.flatMap((segment, index) =>
      (segment.stopIds ?? []).includes(stopId)
        ? [`#${index + 1} ${segment.from.en} → ${segment.to.en}`]
        : [],
    );

    return legs.length > 0 ? [{ routeId: route.id, routeName: route.name.en, legs }] : [];
  });
}

/** "East-West Corridor (legs #1 A → B, #2 B → C)" for a blocked-delete message. */
export function describeStopUsage(usage: StopUsage[]): string {
  return usage
    .map(
      ({ routeName, legs }) =>
        `${routeName} (${legs.length === 1 ? "leg" : "legs"} ${legs.join(", ")})`,
    )
    .join("; ");
}
