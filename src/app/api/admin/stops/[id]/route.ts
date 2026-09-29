import { NextResponse } from "next/server";

import { adminStopSchema } from "@/lib/server/admin-schemas";
import {
  deleteStop,
  findRoutesUsingStop,
  listStops,
  StopConflictError,
  upsertStop,
} from "@/lib/server/admin-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const stop = (await listStops()).find((item) => item.id === id);

  if (!stop) {
    return NextResponse.json({ error: "City not found." }, { status: 404 });
  }

  return NextResponse.json({ ...stop, usedBy: await findRoutesUsingStop(id) });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
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

    if (parsed.data.id !== id) {
      // Renaming an id would orphan every leg that references the old one.
      const usedBy = await findRoutesUsingStop(id);

      if (usedBy.length > 0) {
        return NextResponse.json(
          { error: `City id is used by: ${usedBy.join(", ")}. Ids of used cities cannot change.` },
          { status: 409 },
        );
      }
    }

    const stop = await upsertStop(parsed.data);

    if (parsed.data.id !== id) {
      await deleteStop(id);
    }

    return NextResponse.json(stop);
  } catch (error) {
    if (error instanceof StopConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("PATCH /api/admin/stops/[id] failed", error);
    return NextResponse.json({ error: "Failed to update city." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await deleteStop(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StopConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("DELETE /api/admin/stops/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete city." }, { status: 500 });
  }
}
