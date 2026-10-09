import { promises as fs } from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Mirror of sync-from-prod.mjs in the other direction: writes the local
// src/data/admin-store.json into the production database, so a data edit made
// in the file store reaches the deployed app. Routes and markers are upserted
// by id; segments are replaced wholesale per route so ordering (position)
// matches the file. Nothing is deleted from production that the file lacks.
//
// Usage: DATABASE_URL="postgresql://..." node scripts/push-to-prod.mjs

const STORE_FILE_PATH = path.join(process.cwd(), "src/data/admin-store.json");

if (!process.env.DATABASE_URL) {
  console.error("[push-to-prod] DATABASE_URL is not set.");
  process.exit(1);
}

const store = JSON.parse(await fs.readFile(STORE_FILE_PATH, "utf8"));
const stops = store.stops ?? [];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: ["error"],
});

// Custom cities go first: routes reference them by id and are normalized
// against the stop registry on read.
for (const stop of stops) {
  const stopFields = {
    // A deleted built-in city keeps its `hidden` flag inside the name JSON in
    // the database (see admin-store.ts upsertStop).
    name: stop.hidden ? { ...stop.name, hidden: true } : stop.name,
    countryCode: stop.countryCode,
    coordinates: stop.coordinates,
    editorVisible: stop.editorVisible ?? true,
  };

  await prisma.stop.upsert({
    where: { id: stop.id },
    update: stopFields,
    create: { id: stop.id, ...stopFields },
  });
}

for (const route of store.routes) {
  const routeFields = {
    name: route.name,
    routeColor: route.routeColor,
    type: route.type,
    totalDistanceKm: route.totalDistanceKm,
    transitTime: route.transitTime,
    countries: route.countries,
    description: route.description,
    status: route.status,
    animationSpeed: route.animationSpeed,
  };
  const segmentRows = route.segments.map((segment, index) => ({
    id: segment.id,
    mode: segment.mode,
    fromJson: segment.from,
    toJson: segment.to,
    distanceKm: segment.distanceKm,
    coordinates: segment.coordinates,
    displayCoordinates: segment.displayCoordinates,
    stopIds: segment.stopIds ?? [],
    lineStyle: segment.lineStyle ?? "solid",
    position: index,
  }));

  await prisma.route.upsert({
    where: { id: route.id },
    update: { ...routeFields, segments: { deleteMany: {}, create: segmentRows } },
    create: { id: route.id, ...routeFields, segments: { create: segmentRows } },
  });
}

for (const marker of store.markers) {
  const markerFields = {
    name: marker.name,
    description: marker.description,
    category: marker.category,
    icon: marker.icon,
    coordinates: marker.coordinates,
    connectedCorridorIds: marker.connectedCorridorIds ?? [],
    countryCode: marker.countryCode ?? null,
  };

  await prisma.marker.upsert({
    where: { id: marker.id },
    update: markerFields,
    create: { id: marker.id, ...markerFields },
  });
}

if (store.settings) {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: store.settings,
    create: { id: "default", ...store.settings },
  });
}

await prisma.$disconnect();

console.log(
  `[push-to-prod] Wrote ${store.routes.length} routes, ` +
    `${store.routes.reduce((total, route) => total + route.segments.length, 0)} segments, ` +
    `${store.markers.length} markers, ${stops.length} custom cities to the database`,
);
