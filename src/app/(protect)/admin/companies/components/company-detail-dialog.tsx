"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { CompanyRow } from "./companies-table";

type CompanyDetailDialogProps = {
  company: CompanyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
}: CompanyDetailDialogProps) {
  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Company Details</DialogTitle>
          <DialogDescription>
            Review and manage company information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">
                Company Name
              </p>
              <p className="text-lg font-semibold">{company.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Contact Email
              </p>
              <p className="text-base">{company.contactEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Contact Phone
              </p>
              <p className="text-base">{company.contactPhone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Recruiters
              </p>
              <p className="text-base">{company.recruiters}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Jobs
              </p>
              <p className="text-base">{company.jobsActive}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={
                  company.status === "Rejected"
                    ? "destructive"
                    : company.status === "Pending"
                      ? "outline"
                      : "secondary"
                }
              >
                {company.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Submitted Date
              </p>
              <p className="text-base">{company.submitted}</p>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {company.status === "Pending" && (
              <>
                <Button variant="destructive">Reject</Button>
                <Button>Verify</Button>
              </>
            )}
            {company.status === "Verified" && (
              <Button variant="destructive">Revoke Verification</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
