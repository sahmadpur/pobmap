import { NextResponse } from "next/server";

import { appSettingsSchema } from "@/lib/server/admin-schemas";
import { getSettings, updateSettings } from "@/lib/server/admin-store";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const parsed = appSettingsSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid settings payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const settings = await updateSettings(parsed.data);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/admin/settings failed", error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
