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
  type JobRow,
  JobsTable,
} from "@/src/app/(protect)/admin/jobs/components/jobs-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Jobs Management - Jober",
  description: "Review, approve, and manage job postings.",
};

async function fetchJobs(): Promise<JobRow[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return [];
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/jobs?limit=100`, {
      cache: "no-store",
    });

    const data = await res.json();
    
    if (!data.jobs) {
      return [];
    }

    // Transform API data to match JobRow type
    return data.jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.companyProfile?.name || "Unknown Company",
      companyLogo: job.companyProfile?.logoUrl,
      location: job.location,
      category: job.category,
      employmentType: job.employmentType,
      status: job.status,
      submittedAt: job.submittedAt
        ? new Date(job.submittedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : undefined,
      createdAt: new Date(job.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      applicationCount: job.applicationCount || 0,
      viewCount: job.viewCount || 0,
      rejectionReason: job.rejectionReason,
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

async function JobsContent() {
  const jobs = await fetchJobs();

  // Calculate quick stats
  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "Pending").length,
    active: jobs.filter((j) => j.status === "Active").length,
    rejected: jobs.filter((j) => j.status === "Rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {stats.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Jobs</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {stats.rejected}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Jobs Management</CardTitle>
          <CardDescription>
            Review job postings, approve pending submissions, and manage all
            active listings.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <JobsTable data={jobs} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function JobsPage() {
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
        <SiteHeader title="Jobs Management" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Suspense
                  fallback={
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                          <Card key={i}>
                            <CardHeader className="pb-3">
                              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                      <TableSkeleton columns={9} />
                    </div>
                  }
                >
                  <JobsContent />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
