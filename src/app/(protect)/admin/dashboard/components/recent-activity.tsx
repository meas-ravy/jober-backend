"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Briefcase,
  FileText,
  ArrowRight,
  Clock,
  AlertCircle,
  Building2,
  Loader2,
  Inbox,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/src/lib/utils";

type PendingJob = {
  id: string;
  title: string;
  submittedAt: string | null;
  companyProfile: {
    name: string;
    logoUrl: string | null;
  };
};

type RecentApplication = {
  id: string;
  status: string;
  submittedAt: string;
  job: {
    id: string;
    title: string;
    companyProfile: {
      name: string;
    };
  };
  jobSeeker: {
    name: string | null;
    email: string | null;
    jobSeekerProfile?: {
      fullName: string | null;
      avatarUrl: string | null;
    } | null;
    oauthAccounts?: {
      avatarUrl: string | null;
    }[];
  };
};

type ActivityData = {
  pendingJobs: PendingJob[];
  recentApplications: RecentApplication[];
  actionItems: {
    pendingJobReviews: number;
    pendingVerifications: number;
  };
};

function getStatusBadge(status: string) {
  switch (status) {
    case "Submitted":
      return {
        label: "New",
        className:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      };
    case "UnderReview":
      return {
        label: "Reviewing",
        className:
          "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
      };
    case "Shortlisted":
      return {
        label: "Shortlisted",
        className:
          "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      };
    case "Rejected":
      return {
        label: "Rejected",
        className:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
      };
    case "Hired":
      return {
        label: "Hired",
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
      };
    default:
      return {
        label: status,
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      };
  }
}

export function RecentActivity({
  initialData = null,
}: {
  initialData?: ActivityData | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<ActivityData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return; // Skip fetch if we already have initial data
    async function fetchActivity() {
      try {
        const res = await fetch("/api/admin/dashboard/activity");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [initialData]);

  if (loading && !data) return null;

  if (!data) return null;

  const actionItems = data.actionItems ?? {
    pendingJobReviews: 0,
    pendingVerifications: 0,
  };
  const pendingJobs = data.pendingJobs ?? [];
  const recentApplications = data.recentApplications ?? [];

  return (
    <div className="space-y-4">
      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-yellow-600" />
                Pending Reviews
              </CardTitle>
              <CardDescription className="text-xs">
                Jobs waiting for your approval
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
              <Link href="/admin/jobs">
                View all
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingJobs.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
                <div className="rounded-full bg-muted p-2.5">
                  <Inbox className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-muted-foreground">
                    No pending jobs to review.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Post</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingJobs.map(job => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer group hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                              {job.companyProfile.logoUrl ? (
                                <img
                                  src={job.companyProfile.logoUrl}
                                  alt={job.companyProfile.name}
                                  className="h-9 w-9 rounded-lg object-cover"
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {job.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {job.companyProfile.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                            >
                              Pending
                            </Badge>
                            {job.submittedAt && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(job.submittedAt),
                                  {
                                    addSuffix: true,
                                  },
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Recent Applications
              </CardTitle>
              <CardDescription className="text-xs">
                Latest job applications received
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
              <Link href="/admin/application">
                View all
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
                <div className="rounded-full bg-muted p-2.5">
                  <Inbox className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No applications yet</p>
                  <p className="text-xs text-muted-foreground">
                    Applications will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentApplications.map(app => {
                      const statusBadge = getStatusBadge(app.status);
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={
                                  app.jobSeeker.jobSeekerProfile?.fullName ||
                                  app.jobSeeker.name ||
                                  "Unknown"
                                }
                                src={
                                  app.jobSeeker.jobSeekerProfile?.avatarUrl ||
                                  app.jobSeeker.oauthAccounts?.[0]?.avatarUrl ||
                                  undefined
                                }
                                className="h-9 w-9 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {app.jobSeeker.jobSeekerProfile?.fullName ||
                                    app.jobSeeker.name ||
                                    app.jobSeeker.email ||
                                    "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Applied to {app.job.title}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  statusBadge.className,
                                )}
                              >
                                {statusBadge.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(app.submittedAt),
                                  {
                                    addSuffix: true,
                                  },
                                )}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
