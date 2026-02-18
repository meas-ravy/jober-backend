"use client";

import * as React from "react";
import { NavMain } from "@/src/components/nav-main";
import { NavUser } from "@/src/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/src/components/ui/sidebar";
import {
  IconBuildingStore,
  IconDashboard,
  IconHelp,
  IconBriefcase,
  IconListDetails,
  IconSettings,
  IconUsers,
  IconInfoCircle,
  IconBulb,
} from "@tabler/icons-react";
import { NavSecondary } from "./nav-seconary";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Jobs",
      url: "/admin/jobs",
      icon: IconBriefcase,
    },
    {
      title: "Applications",
      url: "/admin/application",
      icon: IconListDetails,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Companies",
      url: "/admin/companies",
      icon: IconBuildingStore,
    },
    {
      title: "Tips",
      url: "/admin/tips",
      icon: IconBulb,
    },
  ],
  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: IconSettings,
    // },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    {
      title: "About",
      url: "https://measravy-site.vercel.app/",
      icon: IconInfoCircle,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <img
                src="/image/app_background.png"
                alt="Jober"
                className="size-11"
              />
              <span className="text-base font-semibold">Jober</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
