import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  type UserRow,
  UsersTable,
} from "@/src/app/(protect)/admin/users/components/users-table";
import { TableSkeleton } from "@/src/components/ui/table-skeleton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Users - Jober",
  description: "Manage job seekers and recruiters in one place.",
};

async function fetchUsers(): Promise<UserRow[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return [];
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      cache: "no-store",
    });

    const data = await res.json();
    return data.users || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

async function UsersContent() {
  const users = await fetchUsers();
  
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>User Directory</CardTitle>
        <CardDescription>
          Manage job seekers and recruiters. Filter by role, status, and search
          by name, email, or phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <UsersTable data={users} />
      </CardContent>
    </Card>
  );
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
