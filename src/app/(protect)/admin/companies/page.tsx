import type { Metadata } from "next";

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

export const metadata: Metadata = {
  title: "Companies | Jober Admin",
  description: "Verify recruiter companies and moderate job postings.",
};

const companies: CompanyRow[] = [
  {
    name: "Brightway Co.",
    contactEmail: "contact@brightway.co",
    contactPhone: "+855 77 913 222",
    recruiters: 5,
    jobsActive: 18,
    status: "Pending",
    submitted: "Jun 12, 2024",
  },
  {
    name: "Northstar Labs",
    contactEmail: "hello@northstar.dev",
    contactPhone: "+855 10 522 884",
    recruiters: 3,
    jobsActive: 7,
    status: "Verified",
    submitted: "Jun 14, 2024",
  },
  {
    name: "Tonica Studio",
    contactEmail: "team@tonica.io",
    contactPhone: "+855 15 601 431",
    recruiters: 2,
    jobsActive: 3,
    status: "Verified",
    submitted: "Jun 20, 2024",
  },
  {
    name: "Evergreen Retail",
    contactEmail: "jobs@evergreen.asia",
    contactPhone: "+855 96 880 112",
    recruiters: 4,
    jobsActive: 10,
    status: "Rejected",
    submitted: "Jun 22, 2024",
  },
  {
    name: "Sunrise Digital",
    contactEmail: "careers@sunrise.digital",
    contactPhone: "+855 12 345 678",
    recruiters: 6,
    jobsActive: 14,
    status: "Pending",
    submitted: "Jun 25, 2024",
  },
  {
    name: "Jober Labs",
    contactEmail: "admin@jober.app",
    contactPhone: "+855 17 210 998",
    recruiters: 2,
    jobsActive: 5,
    status: "Verified",
    submitted: "Jun 28, 2024",
  },
];

export default function CompaniesPage() {
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
                <Card>
                  <CardHeader className="gap-2 border-b">
                    <CardTitle>Company Verification</CardTitle>
                    <CardDescription>
                      Review recruiter companies, verify profiles, and monitor
                      active jobs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <CompaniesTable data={companies} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
