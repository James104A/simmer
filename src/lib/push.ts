import { createPrivateKey, createSign } from "crypto";
import { prisma } from "./prisma";

// Apple Push Notification service (APNs) dispatcher using HTTP/2 JWT auth.
// Requires the following env vars:
//   APNS_TEAM_ID         — Apple Developer Team ID (10 chars)
//   APNS_KEY_ID          — Key ID from APNs key in Apple Developer portal
//   APNS_KEY_P8          — Contents of the .p8 private key (PEM, newlines preserved)
//   APNS_BUNDLE_ID       — Bundle identifier, e.g. com.simmer.app
//   APNS_ENVIRONMENT     — "development" or "production" (default: development)

const APNS_HOST_PROD = "https://api.push.apple.com";
const APNS_HOST_DEV = "https://api.sandbox.push.apple.com";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: string;
};

let cachedJwt: { token: string; issuedAt: number } | null = null;

function getApnsJwt(): string | null {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const keyPem = process.env.APNS_KEY_P8;
  if (!teamId || !keyId || !keyPem) return null;

  // APNs JWTs must be refreshed at least every hour. Refresh every 50min.
  if (cachedJwt && Date.now() - cachedJwt.issuedAt < 50 * 60 * 1000) {
    return cachedJwt.token;
  }

  const header = { alg: "ES256", kid: keyId };
  const claims = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const signingInput = `${encode(header)}.${encode(claims)}`;
  const key = createPrivateKey({ key: keyPem });
  const sign = createSign("SHA256");
  sign.update(signingInput);
  const derSig = sign.sign(key);

  // Convert DER-encoded ECDSA signature to fixed-length r||s (P-256 = 64 bytes)
  const jose = derToJose(derSig, 64);
  const sigB64 = jose
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const token = `${signingInput}.${sigB64}`;
  cachedJwt = { token, issuedAt: Date.now() };
  return token;
}

function derToJose(der: Buffer, outLen: number): Buffer {
  // Minimal DER parser for ECDSA signature (SEQUENCE of two INTEGERs)
  if (der[0] !== 0x30) throw new Error("Invalid DER signature");
  let offset = 2;
  if (der[1] & 0x80) offset = 2 + (der[1] & 0x7f);
  if (der[offset] !== 0x02) throw new Error("Invalid DER R");
  const rLen = der[offset + 1];
  let r = der.subarray(offset + 2, offset + 2 + rLen);
  offset = offset + 2 + rLen;
  if (der[offset] !== 0x02) throw new Error("Invalid DER S");
  const sLen = der[offset + 1];
  let s = der.subarray(offset + 2, offset + 2 + sLen);

  const halfLen = outLen / 2;
  if (r[0] === 0 && r.length > halfLen) r = r.subarray(r.length - halfLen);
  if (s[0] === 0 && s.length > halfLen) s = s.subarray(s.length - halfLen);

  const out = Buffer.alloc(outLen);
  r.copy(out, halfLen - r.length);
  s.copy(out, outLen - s.length);
  return out;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  const jwt = getApnsJwt();
  if (!jwt) {
    console.info("[push] APNs not configured, skipping");
    return;
  }

  const bundleId = process.env.APNS_BUNDLE_ID ?? "com.simmer.app";
  const host =
    process.env.APNS_ENVIRONMENT === "production"
      ? APNS_HOST_PROD
      : APNS_HOST_DEV;

  const devices = await prisma.device.findMany({
    where: { userId, platform: "ios" },
  });
  if (devices.length === 0) return;

  const body = JSON.stringify({
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: payload.sound ?? "default",
      ...(typeof payload.badge === "number" ? { badge: payload.badge } : {}),
    },
    ...(payload.data ?? {}),
  });

  await Promise.all(
    devices.map(async (device) => {
      try {
        const res = await fetch(`${host}/3/device/${device.apnsToken}`, {
          method: "POST",
          headers: {
            authorization: `bearer ${jwt}`,
            "apns-topic": bundleId,
            "apns-push-type": "alert",
            "content-type": "application/json",
          },
          body,
        });
        if (res.status === 410 || res.status === 400) {
          // Token invalid — clean up
          await prisma.device
            .delete({ where: { id: device.id } })
            .catch(() => {});
        } else if (!res.ok) {
          console.warn(
            "[push] APNs returned",
            res.status,
            await res.text().catch(() => "")
          );
        }
      } catch (err) {
        console.error("[push] send failed:", err);
      }
    })
  );
}
