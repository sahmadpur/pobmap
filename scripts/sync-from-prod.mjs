import { promises as fs } from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Replaces src/data/admin-store.json with the live production content, so local
// edits start from what is actually deployed. Reads through the same shapes the
// app uses (src/lib/server/admin-store.ts routeFromPrisma / markerFromPrisma),
// minus the normalization, which happens again on every read anyway.
//
// Usage: DATABASE_URL="postgresql://..." node scripts/sync-from-prod.mjs

const STORE_FILE_PATH = path.join(process.cwd(), "src/data/admin-store.json");

if (!process.env.DATABASE_URL) {
  console.error("[sync-from-prod] DATABASE_URL is not set.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: ["error"],
});

const [routes, markers, settings] = await Promise.all([
  prisma.route.findMany({
    include: { segments: { orderBy: { position: "asc" } } },
    orderBy: { id: "asc" },
  }),
  prisma.marker.findMany({ orderBy: { id: "asc" } }),
  prisma.appSettings.findUnique({ where: { id: "default" } }),
]);

const store = {
  routes: routes.map((route) => ({
    id: route.id,
    name: route.name,
    routeColor: route.routeColor,
    type: route.type,
    totalDistanceKm: route.totalDistanceKm,
    transitTime: route.transitTime,
    countries: route.countries,
    description: route.description,
    status: route.status,
    animationSpeed: route.animationSpeed,
    segments: route.segments.map((segment) => ({
      id: segment.id,
      mode: segment.mode,
      from: segment.fromJson,
      to: segment.toJson,
      distanceKm: segment.distanceKm,
      coordinates: segment.coordinates,
      ...(Array.isArray(segment.displayCoordinates)
        ? { displayCoordinates: segment.displayCoordinates }
        : {}),
      stopIds: segment.stopIds,
    })),
  })),
  markers: markers.map((marker) => ({
    id: marker.id,
    name: marker.name,
    description: marker.description,
    category: marker.category,
    icon: marker.icon,
    coordinates: marker.coordinates,
    connectedCorridorIds: marker.connectedCorridorIds,
  })),
  // Production has no AppSettings row (the app falls back to the seed defaults
  // there), so keep whatever the local store already carries.
  settings: settings
    ? {
        defaultMapCenter: settings.defaultMapCenter,
        defaultZoom: settings.defaultZoom,
        defaultLanguage: settings.defaultLanguage,
        animationEnabled: settings.animationEnabled,
      }
    : JSON.parse(await fs.readFile(STORE_FILE_PATH, "utf8")).settings,
};

await fs.writeFile(STORE_FILE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
await prisma.$disconnect();

console.log(
  `[sync-from-prod] Wrote ${store.routes.length} routes, ` +
    `${store.routes.reduce((total, route) => total + route.segments.length, 0)} segments, ` +
    `${store.markers.length} markers to src/data/admin-store.json`,
);
