import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { ChartAreaInteractive } from "@/src/app/(protect)/admin/dashboard/components/chart-areas";
import { SectionCards } from "@/src/app/(protect)/admin/dashboard/components/section-card";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { StatsSkeleton } from "@/src/components/ui/stats-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard - Jober",
  description: "Overview of job seekers, recruiters, jobs, and applications.",
};

async function fetchDashboardStats() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return null;
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      cache: "no-store",
    });

    const data = await res.json();
    return data.stats;
  } catch (error) {
    return null;
  }
}

async function DashboardStats() {
  const stats = await fetchDashboardStats();

  // Fallback stats if fetch fails
  const defaultStats = {
    jobSeekers: { total: 0, growth: 0 },
    recruiters: { total: 0, growth: 0 },
    activeJobs: { total: 0, growth: 0 },
    applicationsToday: { total: 0, growth: 0 },
  };

  return <SectionCards stats={stats || defaultStats} />;
}

export default async function Dashboard() {
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
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats />
              </Suspense>
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
