"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Briefcase,
  UserCheck,
  FileCheck,
  AlertCircle,
  Info,
  Loader2,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Badge } from "@/src/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
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

// Match icons/colors with the notifications page
function getNotificationIcon(type: string) {
  switch (type) {
    case "NEW_JOB_SUBMISSION":
      return {
        icon: Briefcase,
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        textColor: "text-blue-600 dark:text-blue-400",
      };
    case "NEW_VERIFICATION_REQUEST":
      return {
        icon: UserCheck,
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        textColor: "text-purple-600 dark:text-purple-400",
      };
    case "JOB_STATUS_CHANGE":
      return {
        icon: FileCheck,
        bgColor: "bg-green-100 dark:bg-green-900/30",
        textColor: "text-green-600 dark:text-green-400",
      };
    case "NEW_APPLICATION":
      return {
        icon: FileCheck,
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        textColor: "text-orange-600 dark:text-orange-400",
      };
    case "APPLICATION_UPDATE":
      return {
        icon: AlertCircle,
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        textColor: "text-yellow-600 dark:text-yellow-400",
      };
    default:
      return {
        icon: Info,
        bgColor: "bg-gray-100 dark:bg-gray-800",
        textColor: "text-gray-600 dark:text-gray-400",
      };
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(
          data.notifications.filter((n: Notification) => !n.isRead).length
        );
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
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
      console.error("Failed to mark notifications as read:", err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Badge className="rounded-full bg-blue-600 text-white hover:bg-blue-700 h-5 px-1.5 text-[10px] font-bold">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAsRead()}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[360px]">
          {loading ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-muted p-3">
                <BellOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.slice(0, 10).map((n) => {
                const style = getNotificationIcon(n.type);
                const Icon = style.icon;

                return (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    className={cn(
                      "group flex items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
                      !n.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                  >
                    {/* Type Icon */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        style.bgColor
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4", style.textColor)}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm line-clamp-1",
                            !n.isRead
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/80"
                          )}
                        >
                          {n.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {!n.isRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {n.content}
                      </p>
                      <span className="mt-1 block text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/admin/notifications">
              View all notifications
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
