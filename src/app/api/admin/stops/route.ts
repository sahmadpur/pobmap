import { NextResponse } from "next/server";

import { adminStopSchema } from "@/lib/server/admin-schemas";
import { listStops, StopConflictError, upsertStop } from "@/lib/server/admin-store";

export async function GET() {
  const stops = await listStops();
  return NextResponse.json(stops);
}

export async function POST(request: Request) {
  try {
    const parsed = adminStopSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid city payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const stop = await upsertStop(parsed.data);
    return NextResponse.json(stop);
  } catch (error) {
    if (error instanceof StopConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("POST /api/admin/stops failed", error);
    return NextResponse.json({ error: "Failed to save city." }, { status: 500 });
  }
}
