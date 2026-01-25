import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import {
  validateBulkAction,
  getBulkActionStatus,
  isValidStatusTransition,
  type ApplicationStatusType,
} from "@/src/lib/applications";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: string[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // Check if user has Recruiter role
    if (!roles.includes("Recruiter")) {
      return NextResponse.json(
        { error: "Only recruiters can perform bulk actions" },
        { status: 403 },
      );
    }

    // Parse request body
    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { applicationIds, action } = body as {
      applicationIds?: unknown;
      action?: unknown;
    };

    // Validate applicationIds
    if (
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    ) {
      return NextResponse.json(
        { error: "applicationIds must be a non-empty array" },
        { status: 400 },
      );
    }

    if (applicationIds.some((id) => typeof id !== "string")) {
      return NextResponse.json(
        { error: "All applicationIds must be strings" },
        { status: 400 },
      );
    }

    // Validate action
    if (typeof action !== "string" || !action.trim()) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    const actionValidation = validateBulkAction(action);
    if (!actionValidation.valid) {
      return NextResponse.json(
        { error: actionValidation.error },
        { status: 400 },
      );
    }

    const targetStatus = getBulkActionStatus(action);
    if (!targetStatus) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 },
      );
    }

    // Fetch applications with their jobs to verify ownership
    const applications = await prisma.jobApplication.findMany({
      where: {
        id: { in: applicationIds as string[] },
      },
      include: {
        job: {
          select: {
            recruiterId: true,
          },
        },
      },
    });

    // Check if all applications were found
    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        {
          error: "Some applications were not found",
          details: `Found ${applications.length} out of ${applicationIds.length} applications`,
        },
        { status: 404 },
      );
    }

    // Verify recruiter owns all jobs
    const unauthorizedApps = applications.filter(
      (app) => app.job.recruiterId !== userId,
    );

    if (unauthorizedApps.length > 0) {
      return NextResponse.json(
        {
          error: "You do not have permission to manage some of these applications",
          details: `${unauthorizedApps.length} application(s) belong to jobs you don't own`,
        },
        { status: 403 },
      );
    }

    // Validate all status transitions
    const invalidTransitions = applications.filter(
      (app) =>
        !isValidStatusTransition(
          app.status as ApplicationStatusType,
          targetStatus,
        ),
    );

    if (invalidTransitions.length > 0) {
      return NextResponse.json(
        {
          error: "Some status transitions are not allowed",
          details: `${invalidTransitions.length} application(s) cannot transition to ${targetStatus}`,
          invalidApplications: invalidTransitions.map((app) => ({
            id: app.id,
            currentStatus: app.status,
          })),
        },
        { status: 400 },
      );
    }

    // Perform bulk update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatePromises = applications.map((app) => {
        const updateData: any = {
          status: targetStatus,
          updatedAt: new Date(),
        };

        // Set reviewedAt if not already set
        if (!app.reviewedAt) {
          updateData.reviewedAt = new Date();
        }

        return tx.jobApplication.update({
          where: { id: app.id },
          data: updateData,
        });
      });

      return Promise.all(updatePromises);
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.length} application(s)`,
      updated: result.length,
      action,
      newStatus: targetStatus,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to perform bulk action",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred while updating applications",
      },
      { status: 500 },
    );
  }
}
