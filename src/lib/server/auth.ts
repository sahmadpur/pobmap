import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import type { AdminSession } from "@/types/admin";

export const ADMIN_SESSION_COOKIE = "baku_port_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const FALLBACK_JWT_SECRET = "development-only-baku-port-secret";

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? FALLBACK_JWT_SECRET,
  );
}

export function getSeedAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@bakuport.local",
    password: process.env.ADMIN_PASSWORD ?? "change-me-admin",
  };
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<boolean> {
  const credentials = getSeedAdminCredentials();

  return email === credentials.email && password === credentials.password;
}

export async function createAdminSessionToken(
  session: AdminSession,
): Promise<string> {
  return new SignJWT({ email: session.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSession | null> {
  try {
    const result = await jwtVerify(token, getJwtSecret());
    const email = typeof result.payload.email === "string" ? result.payload.email : null;

    if (!email) {
      return null;
    }

    return { email };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

