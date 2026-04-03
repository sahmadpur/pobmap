export type SupportedLocale = "az" | "en" | "ru";

export type LocalizedText = Record<SupportedLocale, string>;

export type Coordinate = [number, number];

export type TransportMode = "rail" | "ship" | "road";

export type CorridorType = "primary" | "secondary";

export type CorridorStatus = "active" | "planned" | "suspended";

export interface CorridorSegment {
  id: string;
  mode: TransportMode;
  from: LocalizedText;
  to: LocalizedText;
  distanceKm: number;
  coordinates: Coordinate[];
}

export interface CorridorRoute {
  id: string;
  name: LocalizedText;
  routeColor: string;
  type: CorridorType;
  totalDistanceKm: number;
  transitTime: LocalizedText;
  countries: string[];
  description: LocalizedText;
  status: CorridorStatus;
  animationSpeed: number;
  segments: CorridorSegment[];
}

export interface PortMarker {
  id: string;
  coordinates: Coordinate;
  name: LocalizedText;
  role: LocalizedText;
  connectedCorridorIds: string[];
}

export interface MapView {
  center: Coordinate;
  zoom: number;
}
