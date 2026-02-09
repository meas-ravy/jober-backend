import { issueTokensForUser } from "@/src/lib/jwt";
import { verifyAndConsumeOTP } from "@/src/lib/otp";
import prisma from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidCambodianPhone(phone: string): boolean {
  const phoneRegex = /^\+855\d{8,9}$/;
  return phoneRegex.test(phone);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const phone = (body as { phone?: unknown }).phone;
    const otp = (body as { otp?: unknown }).otp;

    if (typeof phone !== "string" || phone.length === 0) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const trimmedPhone = phone.trim();

    if (!isValidCambodianPhone(trimmedPhone)) {
      return NextResponse.json(
        {
          error: "Invalid phone number format",
          details:
            "Phone number must be a valid Cambodian number starting with +855 followed by 8-9 digits (e.g., +855964519228)",
        },
        { status: 400 },
      );
    }

    if (typeof otp !== "string" || otp.length === 0) {
      return NextResponse.json(
        { error: "OTP code is required" },
        { status: 400 },
      );
    }

    if (otp.trim().length !== 4) {
      return NextResponse.json(
        { error: "OTP code must be 4 digits" },
        { status: 400 },
      );
    }
    const isValid = await verifyAndConsumeOTP(trimmedPhone, otp.trim());

    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid or expired OTP code",
          details:
            "The OTP code is incorrect or has expired. Please request a new code.",
        },
        { status: 401 },
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone: trimmedPhone },
      select: { id: true, phone: true, createdAt: true },
    });

    if (!user) {
      // Create new user
      try {
        user = await prisma.user.create({
          data: { phone: trimmedPhone },
          select: { id: true, phone: true, createdAt: true },
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to create user account",
            details:
              "An error occurred while creating your account. Please try again.",
          },
          { status: 500 },
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication failed",
          details: "Unable to authenticate user. Please try again.",
        },
        { status: 500 },
      );
    }

    // Issue authentication tokens
    const tokens = await issueTokensForUser(user.id);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        phone: user.phone,
        roles: tokens.roles,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Handle specific errors with better messages
    if (message.includes("Maximum verification attempts")) {
      return NextResponse.json(
        {
          error: "Too many failed attempts",
          details: message,
        },
        { status: 429 },
      );
    }

    if (message.includes("rate limit") || message.includes("Too many")) {
      return NextResponse.json(
        {
          error: "Too many requests",
          details: message,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Verification failed",
        details:
          process.env.NODE_ENV === "development"
            ? message
            : "An error occurred during verification. Please try again.",
      },
      { status: 500 },
    );
  }
}
