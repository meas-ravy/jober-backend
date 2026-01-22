import { NextResponse } from "next/server";

import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";
import { RoleName } from "@/src/lib/role";
import { validateCloudinaryUrl } from "@/src/lib/cloudinary";

function hasJobFinderRole(roles: RoleName[]): boolean {
  return roles.includes("Job_finder");
}

function isValidGender(gender: unknown): gender is "Male" | "Female" | "Other" {
  return gender === "Male" || gender === "Female" || gender === "Other";
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: RoleName[];
    try {
      ({ userId, roles } = verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!hasJobFinderRole(roles)) {
      return NextResponse.json(
        { error: "Job_finder role required" },
        { status: 403 },
      );
    }

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        dateOfBirth: true,
        email: true,
        avatarUrl: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    let roles: RoleName[];
    try {
      ({ userId, roles } = verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!hasJobFinderRole(roles)) {
      return NextResponse.json(
        { error: "Job_finder role required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const fullName = body.fullName;
    const dateOfBirth = body.dateOfBirth;
    const email = body.email;
    const avatarUrl = body.avatarUrl;
    const gender = body.gender;

    // Validate required fields
    if (typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (typeof dateOfBirth !== "string" || dateOfBirth.trim().length === 0) {
      return NextResponse.json(
        { error: "Date of birth is required" },
        { status: 400 },
      );
    }

    // Validate date format (ISO 8601)
    const parsedDate = new Date(dateOfBirth);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth format" },
        { status: 400 },
      );
    }

    if (!isValidGender(gender)) {
      return NextResponse.json(
        { error: "Gender must be Male, Female, or Other" },
        { status: 400 },
      );
    }

    // Validate avatarUrl if provided
    if (avatarUrl !== null && avatarUrl !== undefined) {
      if (typeof avatarUrl !== "string" || avatarUrl.trim().length === 0) {
        return NextResponse.json(
          { error: "Avatar URL must be a valid string if provided" },
          { status: 400 },
        );
      }

      // Validate that the avatarUrl is a valid Cloudinary URL
      if (!validateCloudinaryUrl(avatarUrl.trim(), "job-seeker-avatar")) {
        return NextResponse.json(
          {
            error:
              "Invalid avatar URL. Must be a valid Cloudinary URL from the job-seeker-avatars folder",
          },
          { status: 400 },
        );
      }
    }

    const profileData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      dateOfBirth: parsedDate,
      gender,
      avatarUrl: avatarUrl ? avatarUrl.trim() : null,
    };

    // Check if profile already exists
    const existing = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Job seeker profile already exists" },
        { status: 409 },
      );
    }

    // Check if email is already in use
    const emailExists = await prisma.jobSeekerProfile.findUnique({
      where: { email: profileData.email },
      select: { id: true },
    });

    if (emailExists) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 },
      );
    }

    const profile = await prisma.jobSeekerProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating job seeker profile:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      );
    }

    let userId: string;
    let roles: RoleName[];
    try {
      ({ userId, roles } = verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!hasJobFinderRole(roles)) {
      return NextResponse.json(
        { error: "Job_finder role required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Check if profile exists
    const existing = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true, email: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Job seeker profile not found" },
        { status: 404 },
      );
    }

    // Build update data object dynamically
    const updateData: {
      fullName?: string;
      dateOfBirth?: Date;
      email?: string;
      avatarUrl?: string | null;
      gender?: "Male" | "Female" | "Other";
    } = {};

    if (body.fullName !== undefined) {
      if (typeof body.fullName !== "string" || body.fullName.trim().length === 0) {
        return NextResponse.json(
          { error: "Full name must be a non-empty string" },
          { status: 400 },
        );
      }
      updateData.fullName = body.fullName.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string" || body.email.trim().length === 0) {
        return NextResponse.json(
          { error: "Email must be a non-empty string" },
          { status: 400 },
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 },
        );
      }

      const newEmail = body.email.trim().toLowerCase();
      // Check if email is already in use by another user
      if (newEmail !== existing.email) {
        const emailExists = await prisma.jobSeekerProfile.findUnique({
          where: { email: newEmail },
          select: { id: true },
        });
        if (emailExists) {
          return NextResponse.json(
            { error: "Email is already in use" },
            { status: 409 },
          );
        }
      }
      updateData.email = newEmail;
    }

    if (body.dateOfBirth !== undefined) {
      if (typeof body.dateOfBirth !== "string" || body.dateOfBirth.trim().length === 0) {
        return NextResponse.json(
          { error: "Date of birth must be a non-empty string" },
          { status: 400 },
        );
      }
      const parsedDate = new Date(body.dateOfBirth);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date of birth format" },
          { status: 400 },
        );
      }
      updateData.dateOfBirth = parsedDate;
    }

    if (body.gender !== undefined) {
      if (!isValidGender(body.gender)) {
        return NextResponse.json(
          { error: "Gender must be Male, Female, or Other" },
          { status: 400 },
        );
      }
      updateData.gender = body.gender;
    }

    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl === null) {
        updateData.avatarUrl = null;
      } else if (typeof body.avatarUrl === "string") {
        if (body.avatarUrl.trim().length === 0) {
          updateData.avatarUrl = null;
        } else {
          // Validate Cloudinary URL
          if (!validateCloudinaryUrl(body.avatarUrl.trim(), "job-seeker-avatar")) {
            return NextResponse.json(
              {
                error:
                  "Invalid avatar URL. Must be a valid Cloudinary URL from the job-seeker-avatars folder",
              },
              { status: 400 },
            );
          }
          updateData.avatarUrl = body.avatarUrl.trim();
        }
      } else {
        return NextResponse.json(
          { error: "Avatar URL must be a string or null" },
          { status: 400 },
        );
      }
    }

    const profile = await prisma.jobSeekerProfile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating job seeker profile:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
