import { NextResponse } from "next/server";

import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";
import { validateCloudinaryUrl } from "@/src/lib/cloudinary";
import { success } from "zod";

export const runtime = "nodejs";

// src\app\api\(recruiter)\company\route.ts

function hasRecruiterRole(roles: RoleName[]): boolean {
  return roles.includes("Recruiter");
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: RoleName[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
        return NextResponse.json({ success: false, error: message }, { status: 401 });
    }

    if (!hasRecruiterRole(roles)) {
      return NextResponse.json(
        { success: false, error: "Recruiter role required" },
        { status: 403 },
      );
    }

    const company = await prisma.companyProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        contactPhone: true,
        location: true,
        description: true,
        logoUrl: true,
        isVerified: true,
        followerCount: true,
        hireRating: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json( { success: true, company }, { status: 200 } );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: RoleName[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }

    if (!hasRecruiterRole(roles)) {
      return NextResponse.json(
        { success: false, error: "Recruiter role required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const name = body.name;
    const contactEmail = body.contactEmail;
    const contactPhone = body.contactPhone;
    const location = body.location;
    const description = body.description;
    const logoUrl = body.logoUrl;

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }
    if (typeof contactEmail !== "string" || contactEmail.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company email is required" },
        { status: 400 },
      );
    }
    if (typeof contactPhone !== "string" || contactPhone.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company phone is required" },
        { status: 400 },
      );
    }
    if (typeof location !== "string" || location.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company location is required" },
        { status: 400 },
      );
    }
    if (typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company description is required" },
        { status: 400 },
      );
    }
    if (typeof logoUrl !== "string" || logoUrl.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company logo URL is required" },
        { status: 400 },
      );
    }

    // Validate that the logoUrl is a valid Cloudinary URL
    if (!validateCloudinaryUrl(logoUrl.trim(), "company-logo")) {
      return NextResponse.json(
        {
          success: false, error:
            "Invalid logo URL. Must be a valid Cloudinary URL from the company-logos folder",
        },
        { status: 400 },
      );
    }

    const updateData = {
      name: name.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone.trim(),
      location: location.trim(),
      description: description.trim(),
      logoUrl: logoUrl.trim(),
    };

    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
          { success: false, error: "Company profile already exists" },
          { status: 409 },
      );
    }

    const company = await prisma.companyProfile.create({
      data: {
        userId,
        ...updateData,
      },
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: RoleName[];
    try {
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ success: false, error: message }, { status: 401 });
    }

    if (!hasRecruiterRole(roles)) {
      return NextResponse.json(
        { success: false, error: "Recruiter role required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Check if profile exists
    const existing = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 404 },
      );
    }

    // Build update data object dynamically
    const updateData: {
      name?: string;
      contactEmail?: string;
      contactPhone?: string;
      location?: string;
      description?: string;
      logoUrl?: string;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company name must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.contactEmail !== undefined) {
      if (typeof body.contactEmail !== "string" || body.contactEmail.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company email must be a non-empty string" },
          { status: 400 },
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contactEmail.trim())) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 },
        );
      }
      updateData.contactEmail = body.contactEmail.trim().toLowerCase();
    }

    if (body.contactPhone !== undefined) {
      if (typeof body.contactPhone !== "string" || body.contactPhone.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company phone must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.contactPhone = body.contactPhone.trim();
    }

    if (body.location !== undefined) {
      if (typeof body.location !== "string" || body.location.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company location must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.location = body.location.trim();
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string" || body.description.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company description must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.description = body.description.trim();
    }

    if (body.logoUrl !== undefined) {
      if (typeof body.logoUrl !== "string" || body.logoUrl.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company logo URL must be a non-empty string" },
          { status: 400 },
        );
      }

      // Validate Cloudinary URL
      if (!validateCloudinaryUrl(body.logoUrl.trim(), "company-logo")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid logo URL. Must be a valid Cloudinary URL from the company-logos folder",
          },
          { status: 400 },
        );
      }
      updateData.logoUrl = body.logoUrl.trim();
    }

    const company = await prisma.companyProfile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating company profile:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

