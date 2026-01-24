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
  type ApplicationRow,
  ApplicationsTable,
} from "@/src/app/(protect)/admin/application/components/applications-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Applications - Jober",
  description: "Review and manage job applications.",
};

async function fetchApplications(): Promise<ApplicationRow[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return [];
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/applications`, {
      cache: "no-store",
    });

    const data = await res.json();
    return data.applications || [];
  } catch (error) {
    console.error("Error fetching applications:", error);
    return [];
  }
}

async function ApplicationsContent() {
  const applications = await fetchApplications();
  
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Job Applications</CardTitle>
        <CardDescription>
          Review and manage all job applications submitted by candidates.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <ApplicationsTable data={applications} />
      </CardContent>
    </Card>
  );
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
              <div className="px-4 lg:px-6">
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
