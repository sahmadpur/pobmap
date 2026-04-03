import type { Coordinate, CorridorRoute, LocalizedText, SupportedLocale } from "@/types/map";

export type MarkerCategory = "port" | "station" | "border" | "city";

export interface AdminMarker {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  category: MarkerCategory;
  icon: string;
  coordinates: Coordinate;
  connectedCorridorIds: string[];
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
  settings: AppSettings;
}

export interface AdminSession {
  email: string;
}

