"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import type { JobRow } from "./jobs-table";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type JobDetailDialogProps = {
  job: JobRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
}: JobDetailDialogProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!job) return null;

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      const response = await fetch(`/api/admin/jobs/${job.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve job");
      }

      // Success - refresh the page
      router.refresh();
      onOpenChange(false);
      setShowRejectForm(false);
      setRejectionReason("");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject job");
      }

      // Success - refresh the page
      router.refresh();
      onOpenChange(false);
      setShowRejectForm(false);
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject job");
    } finally {
      setIsRejecting(false);
    }
  };

  const formatSalary = (job: JobRow) => {
    // This would need the actual salary data from the job
    return "Competitive";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <span className="font-medium">{job.company}</span>
            <span>•</span>
            <span>{job.location}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Metrics */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </p>
              <Badge
                variant="outline"
                className={
                  job.status === "Active"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : job.status === "Pending"
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                      : job.status === "Rejected"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-500 bg-gray-50 text-gray-700"
                }
              >
                {job.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Employment Type
              </p>
              <Badge variant="outline">{job.employmentType}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Applications
              </p>
              <p className="text-lg font-semibold">{job.applicationCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Views
              </p>
              <p className="text-lg font-semibold">{job.viewCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Category
              </p>
              <Badge variant="outline">{job.category}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Submitted
              </p>
              <p className="text-sm">{job.submittedAt || "N/A"}</p>
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

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
              <Label htmlFor="rejection-reason" className="text-red-900 dark:text-red-100">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this job is being rejected (minimum 10 characters)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                disabled={isRejecting}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be sent to the recruiter.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setShowRejectForm(false);
                setRejectionReason("");
                setError(null);
              }}
              disabled={isApproving || isRejecting}
            >
              Close
            </Button>

            {job.status === "Pending" && (
              <div className="flex gap-2">
                {!showRejectForm ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isApproving || isRejecting}
                    >
                      <XCircle className="mr-2 size-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving || isRejecting}
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 size-4" />
                          Approve
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
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
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionReason.trim()}
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 size-4" />
                          Confirm Reject
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
