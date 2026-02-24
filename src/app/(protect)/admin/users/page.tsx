import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  type UserRow,
  UsersTable,
} from "@/src/app/(protect)/admin/users/components/users-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Users - Jober",
  description: "Manage job seekers and recruiters in one place.",
};

async function fetchUsers(): Promise<UserRow[]> {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        jobSeekerProfile: true,
        companyProfile: true,
        _count: {
          select: {
            applications: true,
            postedJobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map(user => {
      const primaryRole = user.roles[0]?.role || "Job_finder";
      const roleName =
        primaryRole === "Job_finder"
          ? "Job Seeker"
          : primaryRole === "Recruiter"
            ? "Recruiter"
            : "Admin";

      let status: "Active" | "Pending" | "Suspended" = "Active";
      if (primaryRole === "Job_finder" && !user.jobSeekerProfile) {
        status = "Pending";
      } else if (primaryRole === "Recruiter" && !user.companyProfile) {
        status = "Pending";
      }

      const displayName = user.jobSeekerProfile?.fullName || "N/A";

      const avatarUrl = user.jobSeekerProfile?.avatarUrl || null;

      // const displayEmail =
      //   user.email ||
      //   user.jobSeekerProfile?.email

      return {
        id: user.id,
        name: displayName,
        avatar: avatarUrl,
        email: user.jobSeekerProfile?.email || "No email",
        phone: user.phone || "N/A",
        role: roleName,
        status,
        joined: user.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        applicationsCount: user._count.applications,
        jobsCount: user._count.postedJobs,
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

async function UsersContent() {
  const users = await fetchUsers();
  return <UsersTable data={users} />;
}

export default async function UsersPage() {
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
        <SiteHeader title="Users Management" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Suspense fallback={<TableSkeleton />}>
                  <UsersContent />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
