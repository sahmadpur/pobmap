import type { DottedStretch } from "@/lib/map-utils";

/**
 * Stretches drawn dotted rather than solid, because the track is not yet built.
 *
 * Each entry names a sub-path inside a segment, not a segment of its own: the
 * unbuilt Aghband-Ordubad link sits in the middle of a longer Alat-Nakhchivan
 * line in three corridors. Keyed by route as well as segment because the same
 * stretch is authored separately in each corridor that carries it. A stretch
 * may also span a whole segment, as Kars-Nakhchivan does.
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
  // Kashgar - Andijan, the unbuilt half of the China-Uzbekistan rail; Andijan -
  // Tashkent is built and stays solid.
  {
    routeId: "east-west",
    segmentId: "east-west-kashgar-tashkent",
    fromStopId: "kashgar",
    toStopId: "andijan",
  },
  // Kars - Igdir - Nakhchivan, not yet built.
  {
    routeId: "east-west",
    segmentId: "east-west-nakhchivan-kars",
    fromStopId: "nakhchivan",
    toStopId: "kars",
  },
  {
    routeId: "north-west",
    segmentId: "north-west-nakhchivan",
    fromStopId: "kars",
    toStopId: "nakhchivan",
  },
  // Astara - Rasht, the missing link of the Iranian section.
  {
    routeId: "north-south",
    segmentId: "north-south-main-4",
    fromStopId: "astara",
    toStopId: "rasht",
  },
  {
    routeId: "south-west",
    segmentId: "south-west-baku-rasht",
    fromStopId: "astara",
    toStopId: "rasht",
  },
];
