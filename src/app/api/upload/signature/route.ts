import { NextResponse } from "next/server";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";
import {
  generateUploadSignature,
  isValidImageType,
  type ImageType,
} from "@/src/lib/cloudinary";
import { RoleName } from "@/src/lib/role";

// Simple in-memory rate limiter
// In production, use Redis or a proper rate limiting solution
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

const RATE_LIMIT = {
  MAX_REQUESTS: 10,
  WINDOW_MS: 60 * 1000, // 1 minute
};

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

function hasRequiredRole(roles: RoleName[], imageType: ImageType): boolean {
  if (imageType === "company-logo") {
    return roles.includes("Recruiter");
  }
  if (imageType === "job-seeker-avatar") {
    return roles.includes("Job_finder");
  }
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
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
      ({ userId, roles } = await verifyAccessToken(token));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid access token";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // 2. Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // 3. Parse and validate request body
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const imageType = (body as { imageType?: unknown }).imageType;

    if (!isValidImageType(imageType)) {
      return NextResponse.json(
        {
          error:
            'Invalid imageType. Must be "company-logo" or "job-seeker-avatar"',
        },
        { status: 400 },
      );
    }

    // 4. Verify user has the required role for this image type
    if (!hasRequiredRole(roles, imageType)) {
      const requiredRole =
        imageType === "company-logo" ? "Recruiter" : "Job_finder";
      return NextResponse.json(
        {
          error: `${requiredRole} role required to upload ${imageType}`,
        },
        { status: 403 },
      );
    }

    // 5. Generate upload signature
    const signatureData = generateUploadSignature(imageType);

    return NextResponse.json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating upload signature:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
