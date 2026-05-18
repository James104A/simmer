import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/devices — register or refresh an APNs device token
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { apnsToken, platform, appVersion } = await request.json();
  if (!apnsToken || typeof apnsToken !== "string") {
    return NextResponse.json(
      { error: "apnsToken is required" },
      { status: 400 }
    );
  }

  const device = await prisma.device.upsert({
    where: { apnsToken },
    update: {
      userId: user.id,
      platform: platform ?? "ios",
      appVersion: appVersion ?? null,
    },
    create: {
      userId: user.id,
      apnsToken,
      platform: platform ?? "ios",
      appVersion: appVersion ?? null,
    },
  });

  return NextResponse.json({ id: device.id }, { status: 201 });
}

// DELETE /api/devices?apnsToken=... — unregister on logout
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apnsToken = request.nextUrl.searchParams.get("apnsToken");
  if (!apnsToken) {
    return NextResponse.json(
      { error: "apnsToken is required" },
      { status: 400 }
    );
  }

  await prisma.device.deleteMany({
    where: { apnsToken, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
