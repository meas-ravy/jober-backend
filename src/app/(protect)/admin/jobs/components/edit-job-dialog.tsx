"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { JobRow } from "./jobs-table";
import { useRouter } from "next/navigation";

type EditJobDialogProps = {
  job: JobRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (job: JobRow) => void;
};

export function EditJobDialog({
  job,
  open,
  onOpenChange,
  onSuccess,
}: EditJobDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setLocation(job.location);
      setStatus(job.status);
    }
  }, [job]);

  if (!job) return null;

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          location,
          status,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update job");
      }

      toast.success("Job updated successfully");
      onOpenChange(false);

      const updatedJob = {
        ...job,
        title,
        location,
        status: status as JobRow["status"],
      };
      if (onSuccess) {
        onSuccess(updatedJob);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update job",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Pencil className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center sm:text-center">
            Edit Job Details
          </DialogTitle>
          <DialogDescription className="text-center">
            Update the title, location, or status for this job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-status">Status</Label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isUpdating}
            >
              <SelectTrigger id="job-status">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Filled">Filled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            className="sm:flex-1 font-medium"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            className="sm:flex-1 font-semibold bg-blue-600 hover:bg-blue-700"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
