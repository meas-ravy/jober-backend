import { verifyAccessToken } from "@/src/lib/auth";
import { revokeAccessToken } from "@/src/lib/jwt";
import { revokeAllUserOAuthTokens } from "@/src/lib/oauth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


export async function POST(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.substring(7);
      
      try {
        // Verify token and get userId
        const payload = await verifyAccessToken(accessToken);
        
        // Revoke the access token
        await revokeAccessToken(accessToken, "logout");
        
        // Revoke OAuth tokens if user authenticated via OAuth
        await revokeAllUserOAuthTokens(payload.userId);
        
        return NextResponse.json({ 
          success: true, 
          message: "Logout successful. Token has been revoked." 
        });
      } catch (error) {
        // If token is invalid/expired/already revoked, still return success
        // (idempotent logout - client thinks they're logged out)
        return NextResponse.json({ 
          success: true, 
          message: "Logout successful." 
        });
      }
    }

    // No token provided
    return NextResponse.json({ 
      success: true, 
      message: "Logout successful." 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
