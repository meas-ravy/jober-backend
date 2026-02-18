"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  FileText,
  Users,
  Building,
  User as UserIcon,
  MapPin,
  Shield,
  ShieldCheck,
  Link2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/src/components/ui/user-avatar";

type UserDetail = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  createdAt: string;
  roles: { role: string }[];
  jobSeekerProfile: {
    fullName: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    avatarUrl: string | null;
  } | null;
  companyProfile: {
    name: string;
    contactEmail: string;
    contactPhone: string;
    location: string;
    description: string;
    logoUrl: string;
    isVerified: boolean;
  } | null;
  oauthAccounts: {
    provider: string;
    email: string;
    name: string | null;
  }[];
  _count: {
    applications: number;
    postedJobs: number;
    follows: number;
  };
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch user details");
        }

        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  const getRoleName = (role: string) => {
    if (role === "Job_finder") return "Job Seeker";
    if (role === "Recruiter") return "Recruiter";
    if (role === "Admin") return "Admin";
    return role;
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === "Recruiter")
      return "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    if (role === "Job_finder")
      return "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
    if (role === "Admin")
      return "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
    return "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300";
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
        <SiteHeader
          title="User Details"
          parent="Users Management"
          parentHref="/admin/users"
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Back Button */}
                <div className="flex items-center gap-3 mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href="/admin/users">
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <h1 className="text-lg font-semibold">User Details</h1>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="flex h-60 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="flex h-60 flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Error Loading User</h2>
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                    <Button onClick={() => router.back()}>Go Back</Button>
                  </div>
                ) : user ? (
                  <div className="rounded-lg border p-6 space-y-6">
                    {/* ── Header: Avatar + Name + Roles ── */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={user?.jobSeekerProfile?.fullName || "N/A"}
                          src={user.jobSeekerProfile?.avatarUrl || "N/A"}
                          className="h-12 w-12 text-lg border shadow-sm"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-xl font-bold leading-tight">
                              {user?.jobSeekerProfile?.fullName || "N/A"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {user.roles.map(r => (
                                <Badge
                                  key={r.role}
                                  variant="outline"
                                  className={`h-5 px-1.5 text-[10px] font-semibold uppercase ${getRoleBadgeClass(r.role)}`}
                                >
                                  {getRoleName(r.role)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {user.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{user.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Quick Info Chips ── */}
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={
                          user.jobSeekerProfile || user.companyProfile
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 gap-1.5"
                            : "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 gap-1.5"
                        }
                      >
                        <Shield className="h-3 w-3" />
                        Status:{" "}
                        {user.jobSeekerProfile || user.companyProfile
                          ? "Active"
                          : "Pending"}
                      </Badge>

                      <Badge variant="outline" className="gap-1.5">
                        <Mail className="h-3 w-3" />
                        {user.email || "No Email"}
                      </Badge>

                      <Badge variant="outline" className="gap-1.5">
                        <Phone className="h-3 w-3" />
                        {user.phone || "No Phone"}
                      </Badge>

                      <Badge variant="outline" className="gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Joined{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Badge>
                    </div>

                    {/* ── Stats Grid ── */}
                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Applications
                          </p>
                          <p className="font-semibold">
                            {user._count.applications}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Jobs Posted
                          </p>
                          <p className="font-semibold">
                            {user._count.postedJobs}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Following
                          </p>
                          <p className="font-semibold">{user._count.follows}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Content Sections ── */}
                    <div className="grid gap-5 md:grid-cols-2 border-t pt-6 ">
                      {/* Left Column: Job Seeker Profile + Linked Accounts */}
                      <div className="space-y-5">
                        {user.jobSeekerProfile && (
                          <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-purple-600">
                              <UserIcon className="h-3.5 w-3.5" />
                              Job Seeker Profile
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <UserIcon className="h-3.5 w-3.5 shrink-0" />
                                <span>{user.jobSeekerProfile.fullName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span>{user.jobSeekerProfile.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Born:{" "}
                                  {new Date(
                                    user.jobSeekerProfile.dateOfBirth,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge
                                variant="secondary"
                                className="font-normal text-[10px] uppercase"
                              >
                                {user.jobSeekerProfile.gender}
                              </Badge>
                            </div>
                          </div>
                        )}

                        {user.oauthAccounts.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">
                              Linked Accounts
                            </h3>
                            <div className="space-y-2">
                              {user.oauthAccounts.map((a, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                                  <span className="capitalize">
                                    {a.provider}: {a.email}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!user.jobSeekerProfile && !user.companyProfile && (
                        <div className="md:col-span-2 p-4 rounded-lg bg-muted/30 border border-dashed flex flex-col items-center justify-center text-center py-12">
                          <UserIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">
                            No profiles yet
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            User hasn&apos;t completed job seeker or recruiter
                            setup.
                          </p>
                        </div>
                      )}

                      {/* Right Column: Company Profile */}
                      <div className="space-y-5">
                        {user.companyProfile && (
                          <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-blue-600">
                              <Building className="h-3.5 w-3.5" />
                              Company Profile
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building className="h-3.5 w-3.5 shrink-0" />
                                  <span className="font-medium text-foreground">
                                    {user.companyProfile.name}
                                  </span>
                                </div>
                                {user.companyProfile.isVerified && (
                                  <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 gap-1 text-[10px]"
                                  >
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span>{user.companyProfile.location}</span>
                              </div>
                              <div className="pt-1">
                                <p className="text-[11px] text-muted-foreground uppercase font-medium mb-1">
                                  Description
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 pl-3 py-0.5">
                                  &ldquo;{user.companyProfile.description}
                                  &rdquo;
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
