import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  type ApplicationRow,
  ApplicationsTable,
} from "@/src/app/(protect)/admin/application/components/applications-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Applications - Jober",
  description: "Review and manage job applications.",
};

async function fetchApplications(): Promise<ApplicationRow[]> {
  try {
    const applications = await prisma.jobApplication.findMany({
      include: {
        jobSeeker: {
          include: {
            jobSeekerProfile: true,
          },
        },
        job: {
          include: {
            companyProfile: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return applications.map(app => ({
      id: app.id,
      applicantName:
        app.jobSeeker.jobSeekerProfile?.fullName || app.jobSeeker.name || "N/A",
      applicantEmail:
        app.jobSeeker.jobSeekerProfile?.email || app.jobSeeker.email || "N/A",
      jobTitle: app.job.title,
      company: app.job.companyProfile.name,
      status: app.status,
      submittedAt: app.submittedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      resumeUrl: app.resumeUrl,
    }));
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

async function ApplicationsContent() {
  const applications = await fetchApplications();

  return <ApplicationsTable data={applications} />;
}

export default async function Application() {
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
        <SiteHeader title="Applications" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 flex flex-col gap-4">
                <Suspense fallback={<TableSkeleton columns={5} />}>
                  <ApplicationsContent />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
