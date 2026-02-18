"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { JobReviewContent } from "../components/job-review-content";
import type { JobRow } from "../components/jobs-table";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export default function AdminJobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch job details");
        }

        const j = data.job;
        const transformedJob: JobRow = {
          id: j.id,
          title: j.title,
          company: j.companyProfile?.name || "Unknown Company",
          companyLogo: j.companyProfile?.logoUrl,
          location: j.location,
          category: j.category,
          employmentType: j.employmentType,
          status: j.status,
          jobImageUrl: j.jobImageUrl,
          salaryType: j.salaryType,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          salaryFixed: j.salaryFixed,
          salaryCurrency: j.salaryCurrency,
          salaryPeriod: j.salaryPeriod,
          description: j.description || "",
          requirements: j.requirements || "",
          responsibilities: j.responsibilities || "",
          benefits: j.benefits,
          skills: j.skills,
          experienceLevel: j.experienceLevel || "",
          workArrangement: j.workArrangement || "",
          applicationDeadline:
            j.applicationDeadline || new Date().toISOString(),
          positionsAvailable: j.positionsAvailable || 1,
          submittedAt: j.submittedAt
            ? new Date(j.submittedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : undefined,
          createdAt: new Date(j.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          applicationCount: j.applicationCount || 0,
          viewCount: j.viewCount || 0,
          rejectionReason: j.rejectionReason,
          isRecommended: j.isRecommended,
        };

        setJob(transformedJob);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
  }, [id]);

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
          title="Review Job"
          parent="Job Management"
          parentHref="/admin/jobs"
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Back Button Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href="/admin/jobs">
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <h1 className="text-lg font-semibold">Review Job</h1>
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
                      <h2 className="text-xl font-bold">Error Loading Job</h2>
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                    <Button onClick={() => router.back()}>Go Back</Button>
                  </div>
                ) : job ? (
                  <div className="rounded-lg border p-6">
                    <JobReviewContent
                      job={job}
                      onSuccess={() => {
                        router.refresh();
                      }}
                    />
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
