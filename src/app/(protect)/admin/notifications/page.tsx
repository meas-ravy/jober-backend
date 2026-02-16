"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  Bell,
  BellOff,
  ArrowRight,
  Briefcase,
  FileCheck,
  UserCheck,
  AlertCircle,
  Info,
  Loader2,
  CheckCheck,
  Filter,
} from "lucide-react";
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

type FilterTab = "all" | "unread";

// Get icon and color based on notification type
function getNotificationStyle(type: string) {
  switch (type) {
    case "NEW_JOB_SUBMISSION":
      return {
        icon: Briefcase,
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-l-blue-500",
        badgeClass:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        label: "Job Submission",
      };
    case "NEW_VERIFICATION_REQUEST":
      return {
        icon: UserCheck,
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        textColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-l-purple-500",
        badgeClass:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        label: "Verification",
      };
    case "JOB_STATUS_CHANGE":
      return {
        icon: FileCheck,
        bgColor: "bg-green-100 dark:bg-green-900/30",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-l-green-500",
        badgeClass:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        label: "Status Change",
      };
    case "NEW_APPLICATION":
      return {
        icon: FileCheck,
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        textColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-l-orange-500",
        badgeClass:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        label: "Application",
      };
    case "APPLICATION_UPDATE":
      return {
        icon: AlertCircle,
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        textColor: "text-yellow-600 dark:text-yellow-400",
        borderColor: "border-l-yellow-500",
        badgeClass:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        label: "App Update",
      };
    default:
      return {
        icon: Info,
        bgColor: "bg-gray-100 dark:bg-gray-800",
        textColor: "text-gray-600 dark:text-gray-400",
        borderColor: "border-l-gray-500",
        badgeClass:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        label: type.replace(/_/g, " "),
      };
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [markingAll, setMarkingAll] = useState(false);

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
      if (!id) setMarkingAll(true);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: id ? [id] : undefined }),
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

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
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Page Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
                    {unreadCount > 0 && (
                      <Badge className="rounded-full bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-0.5 text-xs font-semibold">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage all system notifications and alerts.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead()}
                  disabled={unreadCount === 0 || markingAll}
                  className="gap-2 font-medium"
                >
                  {markingAll ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCheck className="size-4" />
                  )}
                  Mark all as read
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 mb-5 border-b">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                    filter === "all"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2",
                    filter === "unread"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Notification List */}
              {loading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Loading notifications...
                  </span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex h-60 flex-col items-center justify-center gap-4 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {filter === "unread"
                        ? "All caught up!"
                        : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {filter === "unread"
                        ? "You've read all your notifications."
                        : "When something happens, you'll see it here."}
                    </p>
                  </div>
                  {filter === "unread" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      View all notifications
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((n) => {
                    const style = getNotificationStyle(n.type);
                    const Icon = style.icon;

                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "group relative rounded-lg border border-l-4 p-4 transition-all hover:shadow-md",
                          style.borderColor,
                          !n.isRead
                            ? "bg-card shadow-sm"
                            : "bg-card/50 opacity-75 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              style.bgColor
                            )}
                          >
                            <Icon className={cn("h-5 w-5", style.textColor)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "text-sm font-semibold",
                                    !n.isRead && "text-foreground"
                                  )}
                                >
                                  {n.title}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-medium uppercase tracking-wide border",
                                    style.badgeClass
                                  )}
                                >
                                  {style.label}
                                </Badge>
                                {!n.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                )}
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(n.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {n.content}
                            </p>

                            {/* Actions */}
                            <div className="mt-3 flex items-center gap-3">
                              {n.link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1.5 text-xs font-medium"
                                  asChild
                                >
                                  <Link href={n.link}>
                                    View Details
                                    <ArrowRight className="size-3" />
                                  </Link>
                                </Button>
                              )}
                              {!n.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => markAsRead(n.id)}
                                >
                                  <Check className="size-3" />
                                  Mark as read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
