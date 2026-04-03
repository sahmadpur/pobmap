import { NextResponse } from "next/server";

import {
  authenticateAdmin,
  createAdminSessionToken,
  getSessionCookieOptions,
  ADMIN_SESSION_COOKIE,
} from "@/lib/server/auth";
import { loginSchema } from "@/lib/server/admin-schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid login payload." },
        { status: 400 },
      );
    }

    const isValid = await authenticateAdmin(
      parsed.data.email,
      parsed.data.password,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createAdminSessionToken({ email: parsed.data.email });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());

    return response;
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}

