import { issueTokensForUser } from "@/src/lib/jwt";
import { verifyAndConsumeOTP } from "@/src/lib/otp";
import prisma from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);

    const phone = (body as { phone?: unknown }).phone;
    const otp = (body as { otp?: unknown }).otp;

    if (typeof phone !== "string" || phone.length === 0) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    if (typeof otp !== "string" || otp.length === 0) {
      return NextResponse.json(
        { error: "OTP code is required" },
        { status: 400 },
      );
    }
    const isValid = await verifyAndConsumeOTP(phone.trim(), otp);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 401 },
      );
    }

    // check if user exits
    let user = await prisma.user.findUnique({
      where: { phone: phone.trim() },
      select: { id: true, phone: true, createdAt: true },
    });

    if (!user) {
      // create user
      user = await prisma.user.create({
        data: { phone: phone.trim() },
        select: { id: true, phone: true, createdAt: true },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create or retrieve user" },
        { status: 404 },
      );
    }

    const tokens = await issueTokensForUser(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        roles: tokens.roles,
      },
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Handle specific errors
    if (message.includes("Maximum verification attempts")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
