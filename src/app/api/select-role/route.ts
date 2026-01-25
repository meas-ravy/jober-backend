import { NextResponse } from "next/server";
import { issueTokensForUser, revokeAccessToken } from "@/src/lib/jwt";
import prisma from "@/src/lib/prisma";
import { isRoleName } from "@/src/lib/role";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

// src/app/api/select-role/route.ts

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
      ({ userId } = await verifyAccessToken(token));
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

    const existingRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { role: true },
    });

    const hasRole = existingRoles.some((row) => row.role === role);

    // If user already has this role, return success without new token
    if (hasRole) {
      return NextResponse.json({
        success: true,
        message: "Role confirmed",
        user: {
          id: userId,
          roles: existingRoles.map((r) => r.role),
        },
        tokenUpdated: false,
      });
    }

    // Role is changing - switch role and issue new token
    await prisma.$transaction([
      prisma.userRole.deleteMany({
        where: { userId },
      }),
      prisma.userRole.create({
        data: { userId, role },
      }),
    ]);

    // Revoke old token before issuing new one
    await revokeAccessToken(token, "role_switch");

    // Issue new access token with updated role
    const tokens = await issueTokensForUser(userId);

    return NextResponse.json({
      success: true,
      message: "Role switched successfully. Please use the new token.",
      user: {
        id: userId,
        roles: tokens.roles,
      },
      accessToken: tokens.accessToken,
      tokenUpdated: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
