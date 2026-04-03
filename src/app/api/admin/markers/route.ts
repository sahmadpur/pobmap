import { NextResponse } from "next/server";

import { adminMarkerSchema } from "@/lib/server/admin-schemas";
import { listMarkers, upsertMarker } from "@/lib/server/admin-store";

export async function GET() {
  const markers = await listMarkers();
  return NextResponse.json(markers);
}

export async function POST(request: Request) {
  try {
    const parsed = adminMarkerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid marker payload." }, { status: 400 });
    }

    const marker = await upsertMarker(parsed.data);
    return NextResponse.json(marker);
  } catch {
    return NextResponse.json({ error: "Failed to save marker." }, { status: 500 });
  }
}

