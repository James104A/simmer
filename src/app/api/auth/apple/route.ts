import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  hashPassword,
  AUTH_COOKIE,
  AUTH_STATUS_COOKIE,
} from "@/lib/auth";
import { randomUUID } from "crypto";
import { createPublicKey, verify as cryptoVerify } from "crypto";

const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_AUDIENCE = process.env.APPLE_BUNDLE_ID ?? "com.simmer.app";

type AppleKey = {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
};

let cachedKeys: { keys: AppleKey[]; fetchedAt: number } | null = null;

async function getAppleKeys(): Promise<AppleKey[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < 60 * 60 * 1000) {
    return cachedKeys.keys;
  }
  const res = await fetch(APPLE_KEYS_URL);
  if (!res.ok) throw new Error("Failed to fetch Apple JWKS");
  const body = (await res.json()) as { keys: AppleKey[] };
  cachedKeys = { keys: body.keys, fetchedAt: Date.now() };
  return body.keys;
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const b64 = (input + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

type AppleIdTokenPayload = {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string | boolean;
};

async function verifyAppleIdToken(
  idToken: string
): Promise<AppleIdTokenPayload> {
  const [headerB64, payloadB64, signatureB64] = idToken.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Malformed id_token");
  }

  const header = JSON.parse(base64UrlDecode(headerB64).toString("utf8")) as {
    kid: string;
    alg: string;
  };
  const payload = JSON.parse(
    base64UrlDecode(payloadB64).toString("utf8")
  ) as AppleIdTokenPayload;

  const keys = await getAppleKeys();
  const key = keys.find((k) => k.kid === header.kid);
  if (!key) throw new Error("Apple signing key not found");

  const publicKey = createPublicKey({
    key: {
      kty: key.kty,
      n: key.n,
      e: key.e,
    },
    format: "jwk",
  });

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = cryptoVerify(
    "RSA-SHA256",
    signingInput,
    publicKey,
    signature
  );
  if (!valid) throw new Error("Invalid Apple id_token signature");

  if (payload.iss !== APPLE_ISSUER) throw new Error("Invalid issuer");
  if (payload.aud !== APPLE_AUDIENCE) throw new Error("Invalid audience");
  if (Date.now() / 1000 > payload.exp) throw new Error("Token expired");

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, fullName } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "idToken is required" },
        { status: 400 }
      );
    }

    const payload = await verifyAppleIdToken(idToken);
    const appleSub = payload.sub;
    const email = payload.email;

    let user = await prisma.user.findUnique({ where: { appleSub } });

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { appleSub },
        });
      }
    }

    if (!user) {
      if (!email) {
        return NextResponse.json(
          { error: "Apple did not provide an email. Cannot create account." },
          { status: 400 }
        );
      }
      const placeholderHash = await hashPassword(randomUUID());
      user = await prisma.user.create({
        data: {
          email,
          name: (fullName as string | undefined)?.trim() || email.split("@")[0],
          passwordHash: placeholderHash,
          appleSub,
        },
      });
    }

    const { token, expires } = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      token,
      expiresAt: expires.toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires,
      path: "/",
    });

    response.cookies.set(AUTH_STATUS_COOKIE, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Apple sign-in error:", error);
    return NextResponse.json(
      { error: "Apple sign-in failed" },
      { status: 401 }
    );
  }
}
