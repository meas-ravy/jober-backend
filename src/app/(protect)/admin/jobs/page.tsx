import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { Card, CardHeader } from "@/src/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  type JobRow,
  JobsTable,
} from "@/src/app/(protect)/admin/jobs/components/jobs-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import {
  IconBriefcase,
  IconClock,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Jobs Management - Jober",
  description: "Review, approve, and manage job postings.",
};

async function fetchJobs(): Promise<JobRow[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "Admin") {
      return [];
    }

    // Fetch jobs directly from DB — exclude Draft (recruiter's private WIP)
    const jobs = await prisma.job.findMany({
      where: {
        status: { not: "Draft" },
      },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
      include: {
        companyProfile: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description || undefined,
      company: job.companyProfile?.name || "Unknown Company",
      companyLogo: job.companyProfile?.logoUrl || undefined,
      location: job.location,
      category: job.category,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel || undefined,
      workArrangement: job.workArrangement || undefined,
      status: job.status as any,
      jobImageUrl: job.jobImageUrl || undefined,
      salaryType: job.salaryType,
      salaryMin: job.salaryMin || undefined,
      salaryMax: job.salaryMax || undefined,
      salaryFixed: job.salaryFixed || undefined,
      salaryCurrency: job.salaryCurrency,
      salaryPeriod: job.salaryPeriod,
      requirements: job.requirements || undefined,
      responsibilities: job.responsibilities || undefined,
      benefits: job.benefits || undefined,
      skills: job.skills || undefined,
      applicationDeadline: job.applicationDeadline
        ? job.applicationDeadline.toISOString()
        : undefined,
      positionsAvailable: job.positionsAvailable || 1,
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
      rejectionReason: job.rejectionReason || undefined,
      isRecommended: job.isRecommended,
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

async function JobsContent() {
  const jobs = await fetchJobs();

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === "Pending").length,
    active: jobs.filter(j => j.status === "Active").length,
    rejected: jobs.filter(j => j.status === "Rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <IconBriefcase className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-500/10 p-2.5">
              <IconClock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <IconCircleCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-2.5">
              <IconCircleX className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Jobs Table */}
      <JobsTable data={jobs} />
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
