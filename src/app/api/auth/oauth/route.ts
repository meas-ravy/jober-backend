import { NextResponse } from "next/server";
import {
  verifyGoogleToken,
  verifyLinkedInToken,
  createOrUpdateOAuthUser,
  isValidOAuthProvider,
  type GoogleTokenPayload,
  type LinkedInTokenPayload,
} from "@/src/lib/oauth";
import { issueTokensForUser } from "@/src/lib/jwt";
import prisma from "@/src/lib/prisma";
import { OAuthProvider } from "@/src/app/generated/prisma/client";

export const runtime = "nodejs";

interface OAuthRequestBody {
  provider?: unknown;
  idToken?: unknown;
  accessToken?: unknown;
  refreshToken?: unknown;
}

export async function POST(request: Request) {
  try {
    const body: OAuthRequestBody = await request.json().catch(() => ({}));

    // Validate provider
    if (!body.provider || typeof body.provider !== "string") {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 },
      );
    }

    if (!isValidOAuthProvider(body.provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'Google' or 'LinkedIn'" },
        { status: 400 },
      );
    }

    const provider: OAuthProvider = body.provider;

    // Verify token and get user data based on provider
    let userData;
    let tokens: { accessToken?: string; refreshToken?: string } = {};

    if (provider === "Google") {
      // Google requires idToken
      if (!body.idToken || typeof body.idToken !== "string") {
        return NextResponse.json(
          { error: "idToken is required for Google authentication" },
          { status: 400 },
        );
      }

      const googlePayload: GoogleTokenPayload = {
        idToken: body.idToken,
        accessToken:
          typeof body.accessToken === "string" ? body.accessToken : undefined,
        refreshToken:
          typeof body.refreshToken === "string"
            ? body.refreshToken
            : undefined,
      };

      userData = await verifyGoogleToken(googlePayload);
      tokens = {
        accessToken: googlePayload.accessToken,
        refreshToken: googlePayload.refreshToken,
      };
    } else if (provider === "LinkedIn") {
      // LinkedIn requires accessToken
      if (!body.accessToken || typeof body.accessToken !== "string") {
        return NextResponse.json(
          { error: "accessToken is required for LinkedIn authentication" },
          { status: 400 },
        );
      }

      const linkedInPayload: LinkedInTokenPayload = {
        accessToken: body.accessToken,
        refreshToken:
          typeof body.refreshToken === "string"
            ? body.refreshToken
            : undefined,
      };

      userData = await verifyLinkedInToken(linkedInPayload);
      tokens = {
        accessToken: linkedInPayload.accessToken,
        refreshToken: linkedInPayload.refreshToken,
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400 },
      );
    }

    // Create or update user and OAuth account
    const { userId, isNewUser } = await createOrUpdateOAuthUser(
      provider,
      userData,
      tokens,
    );

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Failed to retrieve user" },
        { status: 500 },
      );
    }

    // Generate JWT tokens
    const jwtTokens = await issueTokensForUser(userId);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: isNewUser
          ? "Account created successfully"
          : "Authentication successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          roles: user.roles.map((r) => r.role),
        },
        accessToken: jwtTokens.accessToken,
      },
      { status: isNewUser ? 201 : 200 },
    );
  } catch (error) {
    console.error("OAuth authentication error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (
        error.message.includes("verification failed") ||
        error.message.includes("Invalid")
      ) {
        return NextResponse.json(
          { error: "Invalid or expired OAuth token" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 },
    );
  }
}
