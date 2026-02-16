"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Users,
  Building,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Star,
  Clock,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

type CompanyDetail = {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  description: string;
  logoUrl: string;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  followerCount: number;
  hireRating: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  verifier: {
    name: string | null;
  } | null;
  _count: {
    jobs: number;
    followers: number;
  };
};

export default function AdminCompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [actionResult, setActionResult] = useState<{
    name: string;
  } | null>(null);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/companies/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch company details");
      }

      setCompany(data.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCompany();
  }, [id]);

  const handleVerify = async () => {
    if (!company) return;
    try {
      setVerifying(true);
      const res = await fetch(`/api/admin/companies/${company.id}/verify`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify company");
      }

      setShowVerifyDialog(false);
      setActionResult({ name: company.name });

      setTimeout(() => {
        router.push("/admin/companies");
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Error verifying company:", err);
    } finally {
      setVerifying(false);
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
        <SiteHeader
          title="Review Company"
          parent="Companies"
          parentHref="/admin/companies"
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
                    <Link href="/admin/companies">
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <h1 className="text-lg font-semibold">Review Company</h1>
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
                      <h2 className="text-xl font-bold">
                        Error Loading Company
                      </h2>
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                    <Button onClick={() => router.back()}>Go Back</Button>
                  </div>
                ) : company ? (
                  <div className="rounded-lg border p-6 space-y-6">
                    {/* Success Overlay */}
                    {actionResult && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-lg">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">
                              Company Verified
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              <strong>{actionResult.name}</strong> has been
                              verified successfully.
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Redirecting to companies list...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Verify Confirmation Dialog */}
                    <Dialog
                      open={showVerifyDialog}
                      onOpenChange={setShowVerifyDialog}
                    >
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                          </div>
                          <DialogTitle className="text-center sm:text-center">
                            Verify Company
                          </DialogTitle>
                          <DialogDescription className="text-left">
                            Are you sure you want to verify{" "}
                            <strong className="text-foreground">
                              {company.name}
                            </strong>
                            ? This will mark the company as trusted and visible
                            to all job seekers.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            className="sm:flex-1 font-medium"
                            onClick={() => setShowVerifyDialog(false)}
                            disabled={verifying}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="sm:flex-1 font-semibold bg-green-600 hover:bg-green-700"
                            onClick={handleVerify}
                            disabled={verifying}
                          >
                            {verifying ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 size-4" />
                                Verify Company
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* ── Header: Logo + Company Name + Verify Button ── */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="h-12 w-12 shrink-0 rounded-lg border bg-white object-contain p-1 shadow-sm"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-lg font-bold text-muted-foreground">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <h1 className="text-xl font-bold leading-tight">
                            {company.name}
                          </h1>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {company.user.name ||
                                company.user.phone ||
                                "Owner"}
                            </span>
                            <span>•</span>
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{company.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verify Button */}
                      {!company.isVerified && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            onClick={() => setShowVerifyDialog(true)}
                            disabled={verifying}
                            className="bg-green-600 hover:bg-green-700 font-semibold"
                          >
                            <ShieldCheck className="mr-1.5 size-4" />
                            Verify
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* ── Quick Info Chips ── */}
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={
                          company.isVerified
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 gap-1.5"
                            : "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 gap-1.5"
                        }
                      >
                        {company.isVerified ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {company.isVerified ? "Verified" : "Pending"}
                      </Badge>

                      <Badge variant="outline" className="gap-1.5">
                        <Mail className="h-3 w-3" />
                        {company.contactEmail}
                      </Badge>

                      <Badge variant="outline" className="gap-1.5">
                        <Phone className="h-3 w-3" />
                        {company.contactPhone}
                      </Badge>

                      <Badge variant="outline" className="gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(company.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Badge>
                    </div>

                    {/* ── Details Grid (like job page Experience/Work Mode/Positions/Deadline) ── */}
                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Total Jobs
                          </p>
                          <p className="font-semibold">{company._count.jobs}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Followers
                          </p>
                          <p className="font-semibold">
                            {company._count.followers}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Hire Rating
                          </p>
                          <p className="font-semibold">
                            {company.hireRating > 0
                              ? `${Math.round(company.hireRating * 10) / 10}/5`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">
                            Registered
                          </p>
                          <p className="font-semibold">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Content Sections (like Description/Requirements) ── */}
                    <div className="grid gap-6 md:grid-cols-2 border-t pt-6">
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-semibold mb-2">
                            Description
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {company.description || "No description provided."}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold mb-2">
                            Contact Information
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span>{company.contactEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{company.contactPhone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span>{company.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-semibold mb-2">
                            Owner Information
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserIcon className="h-3.5 w-3.5 shrink-0" />
                              <span>{company.user.name || "Not set"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span>{company.user.phone || "Not set"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span>{company.user.email || "Not set"}</span>
                            </div>
                          </div>
                        </div>

                        {company.isVerified && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">
                              Verification Details
                            </h3>
                            <div className="space-y-2">
                              {company.verifiedAt && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    Verified on{" "}
                                    {new Date(
                                      company.verifiedAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              )}
                              {company.verifier && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <UserIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    By {company.verifier.name || "Admin"}
                                  </span>
                                </div>
                              )}
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
