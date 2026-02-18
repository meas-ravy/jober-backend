"use client";

import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { TipForm } from "../components/tip-form";

export default function NewTipPage() {
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
        <SiteHeader parent="Tips" parentHref="/admin/tips" />
        <div className="flex flex-1 flex-col">
          <TipForm />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
