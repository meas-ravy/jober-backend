import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import {
  generateUploadSignature,
  isValidImageType,
} from "@/src/lib/cloudinary";

export async function POST(request: Request) {
  try {
    // 1. Verify admin session
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const imageType = (body as { imageType?: unknown }).imageType;

    if (!isValidImageType(imageType)) {
      return NextResponse.json({ error: "Invalid imageType" }, { status: 400 });
    }

    // 3. Generate upload signature
    const signatureData = generateUploadSignature(imageType);

    return NextResponse.json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating admin upload signature:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
