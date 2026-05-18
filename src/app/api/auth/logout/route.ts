import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_STATUS_COOKIE, destroySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Accept bearer token (iOS) or cookie (web)
  const authHeader = request.headers.get("authorization");
  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE)?.value;
  }

  if (token) {
    await destroySession(token);
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  response.cookies.set(AUTH_STATUS_COOKIE, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
