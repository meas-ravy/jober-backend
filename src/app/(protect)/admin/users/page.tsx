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
  type UserRow,
  UsersTable,
} from "@/src/app/(protect)/admin/users/components/users-table";

export const metadata: Metadata = {
  title: "Users - Jober",
  description: "Manage job seekers and recruiters in one place.",
};

const users: UserRow[] = [
  {
    name: "Sok Dara",
    email: "dara@jober.app",
    phone: "+855 12 345 678",
    role: "Job Seeker",
    status: "Active",
    joined: "Jun 12, 2024",
  },
  {
    name: "Lina Phan",
    email: "lina@brightway.co",
    phone: "+855 77 913 222",
    role: "Recruiter",
    status: "Pending",
    joined: "Jun 18, 2024",
  },
  {
    name: "Vannak Lim",
    email: "vannak@gmail.com",
    phone: "+855 17 210 998",
    role: "Job Seeker",
    status: "Active",
    joined: "Jun 21, 2024",
  },
  {
    name: "Sreyneang Touch",
    email: "sreyneang@tonica.io",
    phone: "+855 15 601 431",
    role: "Recruiter",
    status: "Active",
    joined: "Jun 25, 2024",
  },
  {
    name: "Chenda Khiev",
    email: "chenda@jober.app",
    phone: "+855 96 880 112",
    role: "Job Seeker",
    status: "Suspended",
    joined: "Jun 27, 2024",
  },
  {
    name: "Rith Sok",
    email: "rith@northstar.dev",
    phone: "+855 10 522 884",
    role: "Recruiter",
    status: "Active",
    joined: "Jun 30, 2024",
  },
];

export default function UsersPage() {
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
        <SiteHeader title="Users" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader className="gap-2 border-b">
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>
                      Filter by role, status, and search by name, email, or
                      phone.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-4">
                    <UsersTable data={users} />
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
