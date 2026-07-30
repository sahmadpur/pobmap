import type { DottedStretch } from "@/lib/map-utils";

/**
 * Stretches drawn dotted rather than solid, because the track is not yet built.
 *
 * Each entry names a sub-path inside a segment, not a segment of its own: the
 * unbuilt Aghband-Ordubad link sits in the middle of a longer Alat-Nakhchivan
 * line in three corridors, and Kashgar-Tashkent is the western half of the
 * Urumqi-Tashkent segment. Keyed by route as well as segment because the same
 * stretch is authored separately in each corridor that carries it.
 */
export const DOTTED_STRETCHES: DottedStretch[] = [
  // The Zangezur gap, shown dotted in every corridor routed across it.
  {
    routeId: "zangezur-corridor",
    segmentId: "zangezur-aghband-ordubad",
    fromStopId: "aghband",
    toStopId: "ordubad",
  },
  {
    routeId: "east-west",
    segmentId: "east-west-zangezur",
    fromStopId: "aghband",
    toStopId: "ordubad",
  },
  {
    routeId: "south-west",
    segmentId: "south-west-zangezur",
    fromStopId: "aghband",
    toStopId: "ordubad",
  },
  {
    routeId: "north-south",
    segmentId: "segment-f9bbebd2-cef9-4930-9039-053546de32c6",
    fromStopId: "aghband",
    toStopId: "ordubad",
  },
  // Kashgar - Andijan - Tashkent, the unbuilt half of the China-Uzbekistan rail.
  {
    routeId: "east-west",
    segmentId: "east-west-kashgar",
    fromStopId: "kashgar",
    toStopId: "tashkent",
  },
];
