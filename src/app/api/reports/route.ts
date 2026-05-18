import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_TARGETS = new Set(["recipe", "user", "feed_event"]);
const ALLOWED_REASONS = new Set([
  "spam",
  "abuse",
  "inappropriate",
  "impersonation",
  "other",
]);

// POST /api/reports — submit a UGC report. Required by App Store 1.2.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetType, targetId, reason, details } = await request.json();

  if (!ALLOWED_TARGETS.has(targetType)) {
    return NextResponse.json(
      { error: "Invalid targetType" },
      { status: 400 }
    );
  }
  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json(
      { error: "targetId is required" },
      { status: 400 }
    );
  }
  if (!ALLOWED_REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      details: typeof details === "string" ? details.slice(0, 2000) : null,
    },
  });

  return NextResponse.json({ id: report.id }, { status: 201 });
}
