import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export const runtime = "nodejs";

// POST /api/companies/[id]/follow - Toggle follow/unfollow for a company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyProfileId } = await params;

    // 1. Verify authentication
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 }
      );
    }

    let userId: string;
    let roles: string[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    // New Role Check: Only Job Seekers can follow
    if (!roles.includes("Job_finder")) {
      return NextResponse.json(
        { error: "Only job seekers can follow companies" },
        { status: 403 }
      );
    }

    // 2. Verify the company exists
    const company = await prisma.companyProfile.findUnique({
      where: { id: companyProfileId },
      select: { id: true, userId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Optional: Prevent users from following their own company
    if (company.userId === userId) {
      return NextResponse.json(
        { error: "You cannot follow your own company" },
        { status: 400 }
      );
    }

    // 3. Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_companyProfileId: {
          followerId: userId,
          companyProfileId: companyProfileId,
        },
      },
    });

    let following = false;

    // 4. Toggle Follow in a transaction
    await prisma.$transaction(async (tx) => {
      if (existingFollow) {
        // Unfollow
        await tx.follow.delete({
          where: {
            followerId_companyProfileId: {
              followerId: userId,
              companyProfileId: companyProfileId,
            },
          },
        });

        // Decrement counter
        await tx.companyProfile.update({
          where: { id: companyProfileId },
          data: { followerCount: { decrement: 1 } },
        });
        following = false;
      } else {
        // Follow
        await tx.follow.create({
          data: {
            followerId: userId,
            companyProfileId: companyProfileId,
          },
        });

        // Increment counter
        await tx.companyProfile.update({
          where: { id: companyProfileId },
          data: { followerCount: { increment: 1 } },
        });
        following = true;
      }
    });

    return NextResponse.json({
      success: true,
      following,
      message: following
        ? "Successfully followed the company"
        : "Successfully unfollowed the company",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error toggling follow:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}