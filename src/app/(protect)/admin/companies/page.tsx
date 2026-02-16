import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  type CompanyRow,
  CompaniesTable,
} from "@/src/app/(protect)/admin/companies/components/companies-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Companies | Jober Admin",
  description: "Verify recruiter companies and moderate job postings.",
};

async function fetchCompanies(): Promise<CompanyRow[]> {
  try {
    const companies = await prisma.companyProfile.findMany({
      include: {
        user: {
          include: {
            roles: true,
          },
        },
        jobs: {
          where: {
            status: "Active",
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedCompanies = await Promise.all(
      companies.map(async company => {
        const recruitersCount = await prisma.job.findMany({
          where: {
            companyProfileId: company.id,
          },
          distinct: ["recruiterId"],
          select: {
            recruiterId: true,
          },
        });

        const status: "Pending" | "Verified" = company.isVerified
          ? "Verified"
          : "Pending";

        return {
          id: company.id,
          name: company.name,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          location: company.location,
          description: company.description,
          logoUrl: company.logoUrl,
          recruiters: recruitersCount.length || 1,
          jobsActive: company.jobs.length,
          jobsTotal: company._count.jobs,
          status,
          submitted: company.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      }),
    );

    return transformedCompanies;
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}

async function CompaniesContent() {
  const companies = await fetchCompanies();
  return <CompaniesTable data={companies} />;
}

export default async function CompaniesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "Admin") {
    redirect("/admin/login");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Companies" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Suspense fallback={<TableSkeleton />}>
                  <CompaniesContent />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
