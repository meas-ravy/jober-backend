import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { auth } from "@/src/lib/firebase-admin";
import { getBearerToken, verifyAccessToken } from "@/src/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let uid: string | null = null;
    let role: string | null = null;

    // 1. Check Admin Session (React Web Admin)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      uid = session.user.id;
      role = "Admin";
    }

    // 2. Check Bearer Token (Flutter Mobile / Web Seeker/Recruiter)
    if (!uid) {
      const token = getBearerToken(req);
      if (token) {
        try {
          const verified = await verifyAccessToken(token);
          uid = verified.userId;
          role = "User";
        } catch (e) {
          console.error("Token verification failed:", e);
        }
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate Custom Token for Firebase Utils
    const customToken = await auth.createCustomToken(uid, { roles: [role] });

    return NextResponse.json({ firebaseToken: customToken });
  } catch (error) {
    console.error("Error generating firebase token:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
