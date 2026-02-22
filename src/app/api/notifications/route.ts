import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

/**
 * GET /api/notifications
 * Retrieves notifications for the current authenticated user.
 * Supports both standard Users (Recruiter/Seeker) and AdminUsers.
 */
export async function GET(request: Request) {
  try {
    let userId: string | null = null;
    let adminId: string | null = null;

    // 1. Check for Admin Session first (React Web)
    const session = await getServerSession(authOptions);
    console.log("Notification API - Session:", {
      hasSession: !!session,
      role: session?.user?.role,
      hasId: !!session?.user?.id,
    });

    if (session?.user?.role === "Admin") {
      adminId = session.user.id || null;
    }

    // 2. Check for Token (Flutter Mobile or Web Seeker/Recruiter)
    // We check this even if admin session is null, but we prioritize admin session
    if (!adminId) {
      const token = getBearerToken(request);
      if (token) {
        try {
          const verified = await verifyAccessToken(token);
          userId = verified.userId;
          console.log("Notification API - Token user verified:", userId);
        } catch (err) {
          console.error(
            "Notification API - Token verification failed:",
            err instanceof Error ? err.message : err,
          );
        }
      } else {
        console.log("Notification API - No Bearer token found in headers");
      }
    }

    if (!userId && !adminId) {
      console.warn(
        "Notification API - 401 Unauthorized: No valid session or token found",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Get query params for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    // 4. Define type filtering logic
    let typeFilter: any = undefined;
    if (role === "Job_finder") {
      typeFilter = {
        in: [
          "INFO",
          "SYSTEM",
          "APPLICATION_UPDATE",
          "NEW_JOB_FROM_FOLLOW",
          "NEW_MESSAGE",
          "INCOMING_CALL",
          "CALL_MISSED",
        ],
      };
    } else if (role === "Recruiter") {
      typeFilter = {
        in: [
          "INFO",
          "SYSTEM",
          "NEW_APPLICATION",
          "VERIFICATION_STATUS",
          "JOB_STATUS_CHANGE",
          "NEW_MESSAGE",
          "INCOMING_CALL",
          "CALL_MISSED",
        ],
      };
    }

    // 5. Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId || undefined },
          { adminId: adminId || undefined },
        ],
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to latest 50
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Marks notifications as read.
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const token = getBearerToken(request);

    let userId: string | null = null;
    let adminId: string | null = null;

    if (session?.user?.role === "Admin" && session.user.id) {
      adminId = session.user.id;
    } else if (token) {
      const verified = await verifyAccessToken(token);
      userId = verified.userId;
    }

    if (!userId && !adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
      // Mark all as read if no IDs provided
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: userId || undefined },
            { adminId: adminId || undefined },
          ],
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          OR: [
            { userId: userId || undefined },
            { adminId: adminId || undefined },
          ],
        },
        data: {
          isRead: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
