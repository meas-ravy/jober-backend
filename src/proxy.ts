import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const adminLoginPath = "/admin/login";
const adminDashboardPath = "/admin/dashboard";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname =
      token?.role === "Admin" ? adminDashboardPath : adminLoginPath;
    return NextResponse.redirect(url);
  }

  if (pathname === adminLoginPath) {
    if (token?.role === "Admin") {
      const url = request.nextUrl.clone();
      url.pathname = adminDashboardPath;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!token || token.role !== "Admin") {
    const url = request.nextUrl.clone();
    url.pathname = adminLoginPath;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
