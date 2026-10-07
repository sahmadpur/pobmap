import type { AdminMarker } from "@/types/admin";

/**
 * Seed markers missing from a store are added back, so stores written by older
 * builds pick up new seeds; stored markers win over their seed. Seeds an admin
 * deleted are listed in `deletedIds` and stay gone.
 */
export function mergeSeedMarkers(
  seedMarkers: AdminMarker[],
  markers: AdminMarker[],
  deletedIds: string[],
): AdminMarker[] {
  const deleted = new Set(deletedIds);
  const mergedMarkers = new Map<string, AdminMarker>();

  seedMarkers.forEach((marker) => {
    if (!deleted.has(marker.id)) {
      mergedMarkers.set(marker.id, marker);
    }
  });

  markers.forEach((marker) => {
    mergedMarkers.set(marker.id, marker);
  });

  return Array.from(mergedMarkers.values());
}
