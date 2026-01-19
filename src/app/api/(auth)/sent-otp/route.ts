import { createOTP } from "@/src/lib/otp";
import { sendOTP } from "@/src/lib/plategate";
import { NextResponse } from "next/server";

// POST /api/auth/send-otp

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);

    const phone = (body as { phone?: unknown }).phone;

    if (typeof phone !== "string" || phone.length === 0) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.trim();
    if (normalizedPhone.length === 0) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Create and send OTP
    const otp = await createOTP(normalizedPhone);
    const providerResponse = await sendOTP(normalizedPhone, otp);

    return NextResponse.json({
      success: true,
      message: "OTP has been sent successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Handle rate limit errors
    if (message.includes("Too many")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
