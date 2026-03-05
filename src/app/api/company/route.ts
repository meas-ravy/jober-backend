import { NextResponse } from "next/server";

import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";
import { validateCloudinaryUrl } from "@/src/lib/cloudinary";
import { success } from "zod";

export const runtime = "nodejs";

// src\app\api\company\route.ts

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
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 },
      );
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

    return NextResponse.json({ success: true, company }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
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
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 },
      );
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
          success: false,
          error:
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
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 },
      );
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

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company name cannot be empty" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    if (contactEmail !== undefined) {
      if (
        typeof contactEmail !== "string" ||
        contactEmail.trim().length === 0
      ) {
        return NextResponse.json(
          { success: false, error: "Company email cannot be empty" },
          { status: 400 },
        );
      }
      updateData.contactEmail = contactEmail.trim().toLowerCase();
    }

    if (contactPhone !== undefined) {
      if (
        typeof contactPhone !== "string" ||
        contactPhone.trim().length === 0
      ) {
        return NextResponse.json(
          { success: false, error: "Company phone cannot be empty" },
          { status: 400 },
        );
      }
      updateData.contactPhone = contactPhone.trim();
    }

    if (location !== undefined) {
      if (typeof location !== "string" || location.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company location cannot be empty" },
          { status: 400 },
        );
      }
      updateData.location = location.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company description cannot be empty" },
          { status: 400 },
        );
      }
      updateData.description = description.trim();
    }

    if (logoUrl !== undefined) {
      if (typeof logoUrl !== "string" || logoUrl.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Company logo URL cannot be empty" },
          { status: 400 },
        );
      }

      // Validate that the logoUrl is a valid Cloudinary URL
      if (!validateCloudinaryUrl(logoUrl.trim(), "company-logo")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid logo URL. Must be a valid Cloudinary URL from the company-logos folder",
          },
          { status: 400 },
        );
      }
      updateData.logoUrl = logoUrl.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided for update" },
        { status: 400 },
      );
    }

    const company = await prisma.companyProfile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
