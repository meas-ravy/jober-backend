"use client";

import { useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { JobRow } from "./jobs-table";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Monitor,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";

type JobReviewContentProps = {
  job: JobRow;
  onSuccess?: () => void;
};

// Format camelCase to readable: FullTime -> Full Time, OnSite -> On Site
function formatLabel(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

// Capitalize each word: "mobile app developer" -> "Mobile App Developer"
function capitalizeTitle(title: string): string {
  return title.replace(/\b\w/g, char => char.toUpperCase());
}

// Split text into list items by newlines, or return as paragraph
function formatTextContent(text: string) {
  const lines = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length <= 1) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    );
  }

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li
          key={i}
          className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function JobReviewContent({ job, onSuccess }: JobReviewContentProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: "approved" | "rejected";
    title: string;
  } | null>(null);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      const response = await fetch(`/api/admin/jobs/${job.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve job");
      }

      setShowApproveDialog(false);
      setActionResult({ type: "approved", title: capitalizeTitle(job.title) });

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push("/admin/jobs");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve job");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      setError("Rejection reason must be at least 10 characters");
      return;
    }

    try {
      setIsRejecting(true);
      setError(null);

      const response = await fetch(`/api/admin/jobs/${job.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject job");
      }

      setShowRejectForm(false);
      setRejectionReason("");
      setActionResult({ type: "rejected", title: capitalizeTitle(job.title) });

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push("/admin/jobs");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject job");
    } finally {
      setIsRejecting(false);
    }
  };

  const formatSalary = (job: JobRow) => {
    if (job.salaryType === "Negotiable") return "Negotiable";

    const currency = job.salaryCurrency || "USD";
    const period = job.salaryPeriod ? `/${job.salaryPeriod.toLowerCase()}` : "";

    if (job.salaryType === "Fixed" && job.salaryFixed) {
      return `${currency} ${job.salaryFixed.toLocaleString()}${period}`;
    }

    if (job.salaryType === "Range" && (job.salaryMin || job.salaryMax)) {
      const min = job.salaryMin ? job.salaryMin.toLocaleString() : "0";
      const max = job.salaryMax ? job.salaryMax.toLocaleString() : "Any";
      return `${currency} ${min} - ${max}${period}`;
    }

    return "Competitive";
  };

  return (
    <div className="space-y-6">
      {/* Banner Image */}
      {job.jobImageUrl && (
        <div className="relative w-full h-48 bg-muted overflow-hidden rounded-lg">
          <img
            src={job.jobImageUrl}
            alt={job.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      )}

      {/* Header: Title + Logo + Actions */}
      <div className={job.jobImageUrl ? "-mt-12 relative px-4" : ""}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="h-12 w-12 shrink-0 rounded-lg border bg-white object-contain p-1 shadow-sm"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-lg font-bold text-muted-foreground">
                {job.company.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold leading-tight">
                {capitalizeTitle(job.title)}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {job.company}
                </span>
                <span>•</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>

          {/* Inline Approve/Reject for Pending */}
          {job.status === "Pending" && (
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectForm(true)}
                disabled={isApproving || isRejecting}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <XCircle className="mr-1.5 size-4" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => setShowApproveDialog(true)}
                disabled={isApproving || isRejecting}
                className="bg-green-600 hover:bg-green-700 font-semibold"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 size-4" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Success Overlay */}
      {actionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-lg">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                actionResult.type === "approved"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {actionResult.type === "approved" ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Job {actionResult.type === "approved" ? "Approved" : "Rejected"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>{actionResult.title}</strong> has been{" "}
                {actionResult.type}.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Redirecting to jobs list...
            </p>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center sm:text-center">
              Approve Job Posting
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to approve{" "}
              <strong className="text-foreground">
                {capitalizeTitle(job.title)}
              </strong>
              ? This job will be published and visible to all job seekers.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1 font-medium"
              onClick={() => setShowApproveDialog(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              className="sm:flex-1 font-semibold bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Approve Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Info Chips */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={
            job.status === "Active"
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : job.status === "Pending"
                ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                : job.status === "Rejected"
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
          }
        >
          {job.status}
        </Badge>

        <Badge variant="outline" className="gap-1.5">
          <Briefcase className="h-3 w-3" />
          {formatLabel(job.employmentType)}
        </Badge>

        <Badge
          variant="outline"
          className="gap-1.5 text-green-600 border-green-300"
        >
          <DollarSign className="h-3 w-3" />
          {formatSalary(job)}
        </Badge>

        {job.submittedAt && (
          <Badge variant="outline" className="gap-1.5">
            <Calendar className="h-3 w-3" />
            {job.submittedAt}
          </Badge>
        )}

        <Badge variant="outline" className="gap-1.5">
          <Tag className="h-3 w-3" />
          {job.category}
        </Badge>
      </div>

      {/* Job Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">
              Experience
            </p>
            <p className="font-semibold">
              {formatLabel(job.experienceLevel || "Not specified")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">
              Work Mode
            </p>
            <p className="font-semibold">
              {formatLabel(job.workArrangement || "Not specified")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">
              Positions
            </p>
            <p className="font-semibold">{job.positionsAvailable || 1}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase font-medium">
              Deadline
            </p>
            <p className="font-semibold">
              {job.applicationDeadline
                ? new Date(job.applicationDeadline).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Skills */}
      {job.skills && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.split(",").map((skill, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="font-normal text-xs"
              >
                {skill.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="grid gap-6 md:grid-cols-2 border-t pt-6">
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            {formatTextContent(job.description || "No description provided.")}
          </div>

          {job.responsibilities && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Responsibilities</h3>
              {formatTextContent(job.responsibilities)}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-2">Requirements</h3>
            {formatTextContent(job.requirements || "No requirements provided.")}
          </div>

          {job.benefits && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Benefits</h3>
              {formatTextContent(job.benefits)}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason if exists */}
      {job.status === "Rejected" && job.rejectionReason && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
            Rejection Reason:
          </p>
          <p className="text-sm text-red-800 dark:text-red-200">
            {job.rejectionReason}
          </p>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={showRejectForm}
        onOpenChange={open => {
          if (!open) {
            setShowRejectForm(false);
            setRejectionReason("");
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center sm:text-center">
              Reject Job Posting
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to reject{" "}
              <strong className="text-foreground">
                {capitalizeTitle(job.title)}
              </strong>
              ? The recruiter will be notified with your reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <Label htmlFor="rejection-reason" className="text-sm">
              Reason for rejection <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g. Job description is incomplete, missing required information..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="min-h-[120px] resize-none focus-visible:ring-red-500/30 focus-visible:border-red-400"
              disabled={isRejecting}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
              <p
                className={`text-xs ${rejectionReason.trim().length < 10 ? "text-muted-foreground" : "text-green-600"}`}
              >
                {rejectionReason.trim().length}/10
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1 font-medium"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
                setError(null);
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="sm:flex-1 font-semibold"
              onClick={handleReject}
              disabled={isRejecting || rejectionReason.trim().length < 10}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Reject Job
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
