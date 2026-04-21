import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

export const AUTH_COOKIE = "auth-token";
export const AUTH_STATUS_COOKIE = "auth-status";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  userId: string
): Promise<{ token: string; expires: Date }> {
  const token = randomUUID();
  const expires = new Date(Date.now() + EXPIRY_MS);

  await prisma.session.create({
    data: { userId, token, expiresAt: expires },
  });

  return { token, expires };
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getCurrentUser(request?: NextRequest) {
  let token: string | undefined;

  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE)?.value;
  }

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}
