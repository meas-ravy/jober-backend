import { NextResponse } from "next/server";
import { issueTokensForUser } from "@/src/lib/jwt";
import prisma from "@/src/lib/prisma";
import { isRoleName } from "@/src/lib/role";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    try {
      ({ userId } = verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const role =
      body && typeof body === "object"
        ? (body as { role?: unknown }).role
        : undefined;

    if (!isRoleName(role)) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (role === "Admin") {
      return NextResponse.json(
        { error: "Admin role cannot be selected" },
        { status: 403 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    const hasRole = existingRoles.some(row => row.role === role);
    if (!hasRole && existingRoles.length > 0) {
      return NextResponse.json(
        { error: "Role already selected" },
        { status: 409 },
      );
    }

    if (!hasRole) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId, role } },
        update: {},
        create: { userId, role },
      });
    }

    const tokens = await issueTokensForUser(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        roles: tokens.roles,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
