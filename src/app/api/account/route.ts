import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  verifyPassword,
  AUTH_COOKIE,
  AUTH_STATUS_COOKIE,
} from "@/lib/auth";

// DELETE /api/account — permanently delete the authenticated user and all data.
// Required by App Store Review Guideline 5.1.1(v).
// For password accounts, requires the current password for confirmation.
// For Apple-only accounts (no password), confirmation is skipped (Apple handles).
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let confirmPassword: string | undefined;
  try {
    const body = await request.json();
    confirmPassword = body?.password;
  } catch {
    // No body is fine for Apple-only accounts
  }

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, appleSub: true },
  });
  if (!full) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAppleOnly = Boolean(full.appleSub) && !confirmPassword;
  if (!isAppleOnly) {
    if (!confirmPassword) {
      return NextResponse.json(
        { error: "Password confirmation required" },
        { status: 400 }
      );
    }
    const ok = await verifyPassword(confirmPassword, full.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 }
      );
    }
  }

  // Cascade delete handles recipes, sessions, devices, friendships, partnerships,
  // saved recipes, cook logs, feed events, blocks, and reports via `onDelete: Cascade`.
  await prisma.user.delete({ where: { id: user.id } });

  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete(AUTH_STATUS_COOKIE);
  return response;
}
