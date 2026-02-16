"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { JobRow } from "./jobs-table";
import { JobReviewContent } from "./job-review-content";

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
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 pt-10">
        <DialogHeader className="sr-only">
          <DialogTitle>Job Details</DialogTitle>
          <DialogDescription>Review and manage job posting</DialogDescription>
        </DialogHeader>
        <JobReviewContent 
          job={job} 
          onSuccess={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
