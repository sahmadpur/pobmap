import { NextResponse } from "next/server";

import { corridorRouteSchema } from "@/lib/server/admin-schemas";
import { deleteRoute, listRoutes, upsertRoute } from "@/lib/server/admin-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const route = (await listRoutes()).find((item) => item.id === id);

  if (!route) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  return NextResponse.json(route);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = corridorRouteSchema.safeParse(await request.json());

    if (!parsed.success || parsed.data.id !== id) {
      return NextResponse.json({ error: "Invalid route payload." }, { status: 400 });
    }

    const route = await upsertRoute(parsed.data);
    return NextResponse.json(route);
  } catch {
    return NextResponse.json({ error: "Failed to update route." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteRoute(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete route." }, { status: 500 });
  }
}

