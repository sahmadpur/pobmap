import { NextResponse } from "next/server";

import { adminMarkerSchema } from "@/lib/server/admin-schemas";
import { deleteMarker, listMarkers, upsertMarker } from "@/lib/server/admin-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const marker = (await listMarkers()).find((item) => item.id === id);

  if (!marker) {
    return NextResponse.json({ error: "Marker not found." }, { status: 404 });
  }

  return NextResponse.json(marker);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = adminMarkerSchema.safeParse(await request.json());

    if (!parsed.success || parsed.data.id !== id) {
      return NextResponse.json({ error: "Invalid marker payload." }, { status: 400 });
    }

    const marker = await upsertMarker(parsed.data);
    return NextResponse.json(marker);
  } catch {
    return NextResponse.json({ error: "Failed to update marker." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteMarker(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete marker." }, { status: 500 });
  }
}

