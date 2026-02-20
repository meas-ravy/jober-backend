import type { Metadata } from "next";
import { ChatContainer } from "./components/chat-container";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { AppSidebar } from "@/src/components/app-sidebar";

export const metadata: Metadata = {
  title: "Messages - Jober Admin",
  description: "Chat with platform users and recruiters in real-time.",
};

export default function MessagesPage() {
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
        <SiteHeader title="Support Messages" />
        <div className="flex flex-1 flex-col p-4 lg:p-6">
          <ChatContainer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
