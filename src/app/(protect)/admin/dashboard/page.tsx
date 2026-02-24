import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { ChartAreaInteractive } from "@/src/app/(protect)/admin/dashboard/components/chart-areas";
import { SectionCards } from "@/src/app/(protect)/admin/dashboard/components/section-card";
import { RecentActivity } from "@/src/app/(protect)/admin/dashboard/components/recent-activity";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { StatsSkeleton } from "@/src/components/ui/stats-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { Skeleton } from "@/src/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard - Jober",
  description: "Overview of job seekers, recruiters, jobs, and applications.",
};

async function StatsSection() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const [
    totalUsers,
    usersThisMonth,
    usersLastMonth,
    totalCompanies,
    companiesThisMonth,
    companiesLastMonth,
    activeJobs,
    activeJobsThisWeek,
    activeJobsLastWeek,
    applicationsToday,
    applicationsYesterday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.companyProfile.count(),
    prisma.companyProfile.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.companyProfile.count({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
    prisma.job.count({ where: { status: "Active" } }),
    prisma.job.count({
      where: {
        status: "Active",
        publishedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.job.count({
      where: {
        status: "Active",
        publishedAt: {
          gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.jobApplication.count({
      where: { submittedAt: { gte: startOfToday } },
    }),
    prisma.jobApplication.count({
      where: {
        submittedAt: {
          gte: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000),
          lt: startOfToday,
        },
      },
    }),
  ]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  const dashboardStats = {
    totalUsers: {
      total: totalUsers,
      growth: calculateGrowth(usersThisMonth, usersLastMonth),
    },
    companies: {
      total: totalCompanies,
      growth: calculateGrowth(companiesThisMonth, companiesLastMonth),
    },
    activeJobs: {
      total: activeJobs,
      growth: calculateGrowth(activeJobsThisWeek, activeJobsLastWeek),
    },
    applicationsToday: {
      total: applicationsToday,
      growth: calculateGrowth(applicationsToday, applicationsYesterday),
    },
  };

  return <SectionCards stats={dashboardStats} />;
}

async function ChartSection() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);

  const [jobs, applications] = await Promise.all([
    prisma.job.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ["Active", "Pending", "Rejected", "Closed", "Filled"] },
      },
      select: { createdAt: true },
    }),
    prisma.jobApplication.findMany({
      where: { submittedAt: { gte: startDate } },
      select: { submittedAt: true },
    }),
  ]);

  const chartMap = new Map<string, { jobs: number; applications: number }>();
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    chartMap.set(key, { jobs: 0, applications: 0 });
  }

  for (const job of jobs) {
    const key = job.createdAt.toISOString().split("T")[0];
    const entry = chartMap.get(key);
    if (entry) entry.jobs++;
  }

  for (const app of applications) {
    const key = app.submittedAt.toISOString().split("T")[0];
    const entry = chartMap.get(key);
    if (entry) entry.applications++;
  }

  const initialChartData = Array.from(chartMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      jobs: counts.jobs,
      applications: counts.applications,
    }));

  return <ChartAreaInteractive initialData={initialChartData} />;
}

async function ActivitySection() {
  const [pendingJobs, recentApplications, pendingCount, pendingVerifications] =
    await Promise.all([
      prisma.job.findMany({
        where: { status: "Pending" },
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          submittedAt: true,
          companyProfile: { select: { name: true, logoUrl: true } },
        },
      }),
      prisma.jobApplication.findMany({
        orderBy: { submittedAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          job: {
            select: {
              id: true,
              title: true,
              companyProfile: { select: { name: true } },
            },
          },
          jobSeeker: {
            select: {
              name: true,
              email: true,
              jobSeekerProfile: {
                select: {
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.job.count({ where: { status: "Pending" } }),
      prisma.companyProfile.count({ where: { isVerified: false } }),
    ]);

  const activityData = {
    pendingJobs: pendingJobs.map(job => ({
      ...job,
      submittedAt: job.submittedAt?.toISOString() || null,
    })),
    recentApplications: recentApplications.map(app => ({
      ...app,
      submittedAt: app.submittedAt.toISOString(),
    })),
    actionItems: {
      pendingJobReviews: pendingCount,
      pendingVerifications: pendingVerifications,
    },
  };

  return <RecentActivity initialData={activityData} />;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== "Admin") {
    redirect("/admin/login");
  }

  const greeting = getGreeting();
  const adminName = session.user.name || "Admin";

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
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Welcome Header */}
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-bold tracking-tight">
                  {greeting}, {adminName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Here&apos;s what&apos;s happening with your platform today.
                </p>
              </div>

              {/* Stats Cards */}
              <Suspense fallback={<StatsSkeleton count={4} />}>
                <StatsSection />
              </Suspense>

              {/* Chart */}
              <div className="px-4 lg:px-6">
                <Suspense
                  fallback={
                    <Skeleton className="h-[350px] w-full rounded-xl" />
                  }
                >
                  <ChartSection />
                </Suspense>
              </div>

              {/* Recent Activity */}
              <div className="px-4 lg:px-6">
                <Suspense
                  fallback={
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                  }
                >
                  <ActivitySection />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
