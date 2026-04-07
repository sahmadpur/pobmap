import { promises as fs } from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import {
  CORRIDORS,
  DEFAULT_MAP_VIEW,
} from "@/data/corridors";
import { REFERENCE_MAP_ROUTES } from "@/data/reference-map-routes";
import { SEED_MARKERS } from "@/data/seed-markers";
import { normalizeCorridorRoute, normalizeCorridorSegment } from "@/lib/corridor-stop-utils";
import { getPrismaClient } from "@/lib/server/prisma";
import type { AppSettings, AdminMarker, AdminStore } from "@/types/admin";
import type { CorridorRoute, LocalizedText } from "@/types/map";

const STORE_FILE_PATH = path.join(process.cwd(), "src/data/admin-store.json");
const SHOULD_USE_PRISMA =
  Boolean(process.env.DATABASE_URL) &&
  process.env.ADMIN_STORAGE_PROVIDER === "prisma";
const SEED_ROUTE_SEGMENTS = new Map(
  CORRIDORS.flatMap((route) =>
    route.segments.map((segment) => [`${route.id}:${segment.id}`, segment] as const),
  ),
);

function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    typeof value === "object" &&
    value !== null &&
    "az" in value &&
    "en" in value &&
    "ru" in value
  );
}

function createSeedStore(): AdminStore {
  return {
    routes: CORRIDORS.map(normalizeCorridorRoute),
    markers: SEED_MARKERS,
    settings: {
      defaultMapCenter: DEFAULT_MAP_VIEW.center,
      defaultZoom: DEFAULT_MAP_VIEW.zoom,
      defaultLanguage: "az",
      animationEnabled: true,
    },
  };
}

function mergeSeedMarkers(markers: AdminMarker[]): AdminMarker[] {
  const mergedMarkers = new Map<string, AdminMarker>();

  SEED_MARKERS.forEach((marker) => {
    mergedMarkers.set(marker.id, marker);
  });

  markers.forEach((marker) => {
    mergedMarkers.set(marker.id, marker);
  });

  return Array.from(mergedMarkers.values());
}

function mergeReferenceRoutes(routes: CorridorRoute[]): CorridorRoute[] {
  const mergedRoutes = new Map<string, CorridorRoute>();

  REFERENCE_MAP_ROUTES.forEach((route) => {
    mergedRoutes.set(route.id, normalizeCorridorRoute(route));
  });

  routes.forEach((route) => {
    mergedRoutes.set(route.id, normalizeCorridorRoute(route));
  });

  return Array.from(mergedRoutes.values());
}

function shouldMigrateReferenceRoutes(routes: CorridorRoute[] | undefined): boolean {
  if (!routes || routes.length === 0) {
    return false;
  }

  return routes.length === 1 && routes[0]?.id === "north-south";
}

function mergeSeedPresentationPath(route: CorridorRoute): CorridorRoute {
  return {
    ...route,
    segments: route.segments.map((segment) => {
      const seedSegment = SEED_ROUTE_SEGMENTS.get(`${route.id}:${segment.id}`);

      return {
        ...segment,
        displayCoordinates:
          segment.displayCoordinates && segment.displayCoordinates.length > 0
            ? segment.displayCoordinates
            : seedSegment?.displayCoordinates,
      };
    }),
  };
}

async function ensureFileStore(): Promise<AdminStore> {
  try {
    const raw = await fs.readFile(STORE_FILE_PATH, "utf8");
    const parsedStore = JSON.parse(raw) as AdminStore;
    const mergedMarkers = mergeSeedMarkers(parsedStore.markers ?? []);
    const mergedRoutes = shouldMigrateReferenceRoutes(parsedStore.routes)
      ? mergeReferenceRoutes(parsedStore.routes ?? [])
      : parsedStore.routes ?? [];

    if (
      mergedMarkers.length !== (parsedStore.markers ?? []).length ||
      mergedRoutes.length !== (parsedStore.routes ?? []).length
    ) {
      const nextStore = {
        ...parsedStore,
        routes: mergedRoutes,
        markers: mergedMarkers,
      };
      await saveFileStore(nextStore);
      return nextStore;
    }

    return {
      ...parsedStore,
      routes: mergedRoutes,
      markers: mergedMarkers,
    };
  } catch {
    const seed = createSeedStore();
    await fs.writeFile(STORE_FILE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

async function saveFileStore(store: AdminStore) {
  await fs.writeFile(STORE_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function routeFromPrisma(route: {
  id: string;
  name: Prisma.JsonValue;
  routeColor: string;
  type: string;
  totalDistanceKm: number;
  transitTime: Prisma.JsonValue;
  countries: string[];
  description: Prisma.JsonValue;
  status: string;
  animationSpeed: number;
  segments: Array<{
    id: string;
    mode: string;
    fromJson: Prisma.JsonValue;
    toJson: Prisma.JsonValue;
    distanceKm: number;
    coordinates: Prisma.JsonValue;
    displayCoordinates: Prisma.JsonValue | null;
    stopIds: string[];
  }>;
}): CorridorRoute {
  if (
    !isLocalizedText(route.name) ||
    !isLocalizedText(route.transitTime) ||
    !isLocalizedText(route.description)
  ) {
    throw new Error("Invalid localized route payload in database.");
  }

  return mergeSeedPresentationPath({
    id: route.id,
    name: route.name,
    routeColor: route.routeColor,
    type: route.type as CorridorRoute["type"],
    totalDistanceKm: route.totalDistanceKm,
    transitTime: route.transitTime,
    countries: route.countries,
    description: route.description,
    status: route.status as CorridorRoute["status"],
    animationSpeed: route.animationSpeed,
    segments: route.segments.map((segment) => {
      if (
        !isLocalizedText(segment.fromJson) ||
        !isLocalizedText(segment.toJson) ||
        !Array.isArray(segment.coordinates)
      ) {
        throw new Error("Invalid route segment payload in database.");
      }

      return normalizeCorridorSegment({
        id: segment.id,
        mode: segment.mode as CorridorRoute["segments"][number]["mode"],
        from: segment.fromJson,
        to: segment.toJson,
        distanceKm: segment.distanceKm,
        coordinates: segment.coordinates as CorridorRoute["segments"][number]["coordinates"],
        displayCoordinates: Array.isArray(segment.displayCoordinates)
          ? (segment.displayCoordinates as CorridorRoute["segments"][number]["coordinates"])
          : undefined,
        stopIds: segment.stopIds,
      });
    }),
  });
}

function markerFromPrisma(marker: {
  id: string;
  name: Prisma.JsonValue;
  description: Prisma.JsonValue;
  category: string;
  icon: string;
  coordinates: Prisma.JsonValue;
  connectedCorridorIds: string[];
}): AdminMarker {
  if (
    !isLocalizedText(marker.name) ||
    !isLocalizedText(marker.description) ||
    !Array.isArray(marker.coordinates)
  ) {
    throw new Error("Invalid marker payload in database.");
  }

  return {
    id: marker.id,
    name: marker.name,
    description: marker.description,
    category: marker.category as AdminMarker["category"],
    icon: marker.icon,
    coordinates: marker.coordinates as AdminMarker["coordinates"],
    connectedCorridorIds: marker.connectedCorridorIds,
  };
}

async function listPrismaRoutes() {
  const routes = await getPrismaClient().route.findMany({
    include: {
      segments: {
        orderBy: { position: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  return routes.map(routeFromPrisma);
}

async function listPrismaMarkers() {
  const markers = await getPrismaClient().marker.findMany({
    orderBy: { id: "asc" },
  });

  return markers.map(markerFromPrisma);
}

async function getPrismaSettings(): Promise<AppSettings> {
  const settings = await getPrismaClient().appSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings || !Array.isArray(settings.defaultMapCenter)) {
    return createSeedStore().settings;
  }

  return {
    defaultMapCenter: settings.defaultMapCenter as AppSettings["defaultMapCenter"],
    defaultZoom: settings.defaultZoom,
    defaultLanguage: settings.defaultLanguage as AppSettings["defaultLanguage"],
    animationEnabled: settings.animationEnabled,
  };
}

export async function listRoutes(): Promise<CorridorRoute[]> {
  if (SHOULD_USE_PRISMA) {
    return listPrismaRoutes();
  }

  const store = await ensureFileStore();
  return store.routes.map((route) =>
    mergeSeedPresentationPath(normalizeCorridorRoute(route)),
  );
}

export async function upsertRoute(route: CorridorRoute): Promise<CorridorRoute> {
  const normalizedRoute = mergeSeedPresentationPath(normalizeCorridorRoute(route));

  if (SHOULD_USE_PRISMA) {
    await getPrismaClient().route.upsert({
      where: { id: normalizedRoute.id },
      update: {
        name: normalizedRoute.name,
        routeColor: normalizedRoute.routeColor,
        type: normalizedRoute.type,
        totalDistanceKm: normalizedRoute.totalDistanceKm,
        transitTime: normalizedRoute.transitTime,
        countries: normalizedRoute.countries,
        description: normalizedRoute.description,
        status: normalizedRoute.status,
        animationSpeed: normalizedRoute.animationSpeed,
        segments: {
          deleteMany: {},
          create: normalizedRoute.segments.map((segment, index) => ({
            id: segment.id,
            mode: segment.mode,
            fromJson: segment.from,
            toJson: segment.to,
            distanceKm: segment.distanceKm,
            coordinates: segment.coordinates,
            displayCoordinates: segment.displayCoordinates,
            stopIds: segment.stopIds ?? [],
            position: index,
          })),
        },
      },
      create: {
        id: normalizedRoute.id,
        name: normalizedRoute.name,
        routeColor: normalizedRoute.routeColor,
        type: normalizedRoute.type,
        totalDistanceKm: normalizedRoute.totalDistanceKm,
        transitTime: normalizedRoute.transitTime,
        countries: normalizedRoute.countries,
        description: normalizedRoute.description,
        status: normalizedRoute.status,
        animationSpeed: normalizedRoute.animationSpeed,
        segments: {
          create: normalizedRoute.segments.map((segment, index) => ({
            id: segment.id,
            mode: segment.mode,
            fromJson: segment.from,
            toJson: segment.to,
            distanceKm: segment.distanceKm,
            coordinates: segment.coordinates,
            displayCoordinates: segment.displayCoordinates,
            stopIds: segment.stopIds ?? [],
            position: index,
          })),
        },
      },
    });

    return normalizedRoute;
  }

  const store = await ensureFileStore();
  const existingIndex = store.routes.findIndex((item) => item.id === normalizedRoute.id);

  if (existingIndex >= 0) {
    store.routes[existingIndex] = normalizedRoute;
  } else {
    store.routes.push(normalizedRoute);
  }

  await saveFileStore(store);
  return normalizedRoute;
}

export async function deleteRoute(id: string) {
  if (SHOULD_USE_PRISMA) {
    await getPrismaClient().route.delete({ where: { id } });
    return;
  }

  const store = await ensureFileStore();
  store.routes = store.routes.filter((route) => route.id !== id);

  await saveFileStore(store);
}

export async function listMarkers(): Promise<AdminMarker[]> {
  if (SHOULD_USE_PRISMA) {
    return listPrismaMarkers();
  }

  const store = await ensureFileStore();
  return mergeSeedMarkers(store.markers ?? []);
}

export async function upsertMarker(marker: AdminMarker): Promise<AdminMarker> {
  if (SHOULD_USE_PRISMA) {
    await getPrismaClient().marker.upsert({
      where: { id: marker.id },
      update: {
        name: marker.name,
        description: marker.description,
        category: marker.category,
        icon: marker.icon,
        coordinates: marker.coordinates,
        connectedCorridorIds: marker.connectedCorridorIds,
      },
      create: {
        id: marker.id,
        name: marker.name,
        description: marker.description,
        category: marker.category,
        icon: marker.icon,
        coordinates: marker.coordinates,
        connectedCorridorIds: marker.connectedCorridorIds,
      },
    });

    return marker;
  }

  const store = await ensureFileStore();
  const existingIndex = store.markers.findIndex((item) => item.id === marker.id);

  if (existingIndex >= 0) {
    store.markers[existingIndex] = marker;
  } else {
    store.markers.push(marker);
  }

  await saveFileStore(store);
  return marker;
}

export async function deleteMarker(id: string) {
  if (SHOULD_USE_PRISMA) {
    await getPrismaClient().marker.delete({ where: { id } });
    return;
  }

  const store = await ensureFileStore();
  store.markers = store.markers.filter((marker) => marker.id !== id);

  await saveFileStore(store);
}

export async function getSettings(): Promise<AppSettings> {
  if (SHOULD_USE_PRISMA) {
    return getPrismaSettings();
  }

  const store = await ensureFileStore();
  return store.settings;
}
