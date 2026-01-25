import { createOTP } from "@/src/lib/otp";
import { sendOTP } from "@/src/lib/plategate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidCambodianPhone(phone: string): boolean {
  const phoneRegex = /^\+855\d{8,9}$/;
  return phoneRegex.test(phone);
}

// POST /api/resend-otp

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

    if (!isValidCambodianPhone(normalizedPhone)) {
      return NextResponse.json(
        { 
          error: "Invalid phone number format",
          details: "Phone number must be a valid Cambodian number starting with +855 followed by 8-9 digits"
        },
        { status: 400 },
      );
    }

    // Create and send new OTP (this automatically invalidates previous unused OTPs)
    const otp = await createOTP(normalizedPhone);
    
    try {
      await sendOTP(normalizedPhone, otp);
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      return NextResponse.json(
        { 
          error: "Failed to send OTP",
          details: "Unable to send SMS. Please check your phone number or try again later."
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "A new OTP has been sent to your phone",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Handle rate limit errors
    if (message.includes("Too many") || message.includes("rate limit")) {
      return NextResponse.json({ 
        error: "Too many requests",
        details: message
      }, { status: 429 });
    }

    return NextResponse.json({ 
      error: "Failed to resend OTP",
      details: process.env.NODE_ENV === 'development' ? message : "An error occurred. Please try again."
    }, { status: 500 });
  }
}
