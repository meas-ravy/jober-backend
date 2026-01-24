import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  type CompanyRow,
  CompaniesTable,
} from "@/src/app/(protect)/admin/companies/components/companies-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Companies | Jober Admin",
  description: "Verify recruiter companies and moderate job postings.",
};

async function fetchCompanies(): Promise<CompanyRow[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return [];
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      cache: "no-store",
    });


    const data = await res.json();
    return data.companies || [];
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}

async function CompaniesContent() {
  const companies = await fetchCompanies();
  
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Company Verification</CardTitle>
        <CardDescription>
          Review recruiter companies, verify profiles, and monitor active jobs.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <CompaniesTable data={companies} />
      </CardContent>
    </Card>
  );
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
