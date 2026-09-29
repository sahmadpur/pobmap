import type { TransportStop } from "@/data/transport-stops";
import type { Coordinate, CorridorRoute, LocalizedText, SupportedLocale } from "@/types/map";

/** A city created by an admin on the map; same shape as a catalog stop. */
export type AdminStop = TransportStop;

export type MarkerCategory = "port" | "station" | "border" | "city";

export type MarkerTier = "major" | "standard";

export interface AdminMarker {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  category: MarkerCategory;
  icon: string;
  coordinates: Coordinate;
  connectedCorridorIds: string[];
  /**
   * ISO-2 code, set by the map editor so a marker used as a leg endpoint can
   * carry a flag like a city does. Older markers have none.
   */
  countryCode?: string;
  /**
   * Overrides the computed major/standard tier for specific corridors, keyed
   * by corridor id. Needed because a marker's prominence can differ by
   * corridor (e.g. Aktau is a headline stop on East-West but a minor waypoint
   * on North-West) and because the heuristic in `marker-visibility.ts` alone
   * doesn't match every stakeholder-specified city.
   */
  corridorTiers?: Partial<Record<string, MarkerTier>>;
}

export interface AppSettings {
  defaultMapCenter: Coordinate;
  defaultZoom: number;
  defaultLanguage: SupportedLocale;
  animationEnabled: boolean;
}

export interface AdminStore {
  routes: CorridorRoute[];
  markers: AdminMarker[];
  /** Custom cities; absent in stores written before the map editor existed. */
  stops?: AdminStop[];
  settings: AppSettings;
}

export interface AdminSession {
  email: string;
}

