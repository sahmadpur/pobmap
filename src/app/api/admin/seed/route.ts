import { NextResponse } from "next/server";

import adminStoreSeed from "@/data/admin-store.json";
import {
  listMarkers,
  listRoutes,
  upsertMarker,
  upsertRoute,
} from "@/lib/server/admin-store";
import type { AdminMarker, AdminStore } from "@/types/admin";
import type { CorridorRoute } from "@/types/map";

const seed = adminStoreSeed as unknown as AdminStore;

function isPrismaMode() {
  return (
    Boolean(process.env.DATABASE_URL) &&
    process.env.ADMIN_STORAGE_PROVIDER === "prisma"
  );
}

/** Reports the active storage mode and current record counts. */
export async function GET() {
  return NextResponse.json({
    storage: isPrismaMode() ? "prisma" : "file",
    routes: (await listRoutes()).length,
    markers: (await listMarkers()).length,
  });
}

/**
 * One-time seed for the production database. Copies the routes and markers from
 * the bundled store into Postgres via the same upsert path the admin uses, so a
 * fresh Prisma deployment starts with the content the file store served. Upserts
 * are idempotent, so re-running only refreshes existing records.
 */
export async function POST() {
  if (!isPrismaMode()) {
    return NextResponse.json(
      {
        error:
          "Seeding only runs in Prisma mode. Set ADMIN_STORAGE_PROVIDER=prisma and DATABASE_URL, then redeploy.",
      },
      { status: 400 },
    );
  }

  try {
    const routes: CorridorRoute[] = seed.routes ?? [];
    const markers: AdminMarker[] = seed.markers ?? [];

    for (const route of routes) {
      await upsertRoute(route);
    }

    for (const marker of markers) {
      await upsertMarker(marker);
    }

    return NextResponse.json({
      ok: true,
      seededRoutes: routes.length,
      seededMarkers: markers.length,
    });
  } catch (error) {
    console.error("POST /api/admin/seed failed", error);
    return NextResponse.json({ error: "Failed to seed database." }, { status: 500 });
  }
}
