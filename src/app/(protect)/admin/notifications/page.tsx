"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Check, Bell, BellOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

type Notification = {
  id: string;
  title: string;
  content: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: id ? [id] : undefined }),
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'NEW_JOB_SUBMISSION': return 'default';
      case 'NEW_VERIFICATION_REQUEST': return 'secondary';
      default: return 'outline';
    }
  };

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
        <SiteHeader title="Notifications" />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div>
                <CardTitle className="text-2xl font-bold">Inbox</CardTitle>
                <CardDescription>
                  Manage all system notifications and alerts.
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAsRead()}
                disabled={notifications.every(n => n.isRead)}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 text-muted" />
                    <span className="text-sm text-muted-foreground">Loading notifications...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-4 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <BellOff className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">No notifications</p>
                    <p className="text-sm text-muted-foreground">Your inbox is clean for now.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y overflow-hidden rounded-md border">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "group flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                        !n.isRead && "bg-muted/20"
                      )}
                    >
                      <div className={cn(
                        "mt-1 rounded-full p-2",
                        !n.isRead ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" : "bg-muted text-muted-foreground"
                      )}>
                        <Bell className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-base font-semibold", !n.isRead && "text-blue-600 dark:text-blue-400")}>
                              {n.title}
                            </span>
                            <Badge variant={getBadgeVariant(n.type)} className="text-[10px] uppercase tracking-wider">
                              {n.type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {n.content}
                        </p>
                        
                        <div className="flex items-center gap-3 pt-2">
                          {n.link && (
                            <Button variant="link" className="h-auto p-0 text-sm" asChild>
                              <Link href={n.link}>
                                View Details <ArrowRight className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          )}
                          {!n.isRead && (
                            <Button 
                              variant="ghost" 
                              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => markAsRead(n.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
