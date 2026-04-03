import { NextResponse } from "next/server";

import { corridorRouteSchema } from "@/lib/server/admin-schemas";
import { listRoutes, upsertRoute } from "@/lib/server/admin-store";

export async function GET() {
  const routes = await listRoutes();
  return NextResponse.json(routes);
}

export async function POST(request: Request) {
  try {
    const parsed = corridorRouteSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid route payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const route = await upsertRoute(parsed.data);
    return NextResponse.json(route);
  } catch {
    return NextResponse.json({ error: "Failed to save route." }, { status: 500 });
  }
}
