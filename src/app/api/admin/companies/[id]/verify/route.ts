import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

// PATCH /api/admin/companies/[id]/verify - Verify a company
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate Admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin role required." },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;
    const adminId = session.user.id;

    // 2. Check if company exists
    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // 3. Mark as verified
    const updatedCompany = await prisma.companyProfile.update({
      where: { id: companyId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company verified successfully",
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        isVerified: updatedCompany.isVerified,
        verifiedAt: updatedCompany.verifiedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying company:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
