"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { type TipRow, TipsTable } from "./components/tips-table";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TipsPage() {
  const [tips, setTips] = useState<TipRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete confirmation
  const [deleteTip, setDeleteTip] = useState<TipRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tips");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch tips");

      const transformed: TipRow[] = data.tips.map(
        (tip: {
          id: string;
          title: string;
          content: string;
          imageUrl: string | null;
          category: string;
          isPublished: boolean;
          createdAt: string;
          author: { name: string | null };
        }) => ({
          id: tip.id,
          title: tip.title,
          content: tip.content,
          imageUrl: tip.imageUrl,
          category: tip.category,
          isPublished: tip.isPublished,
          authorName: tip.author?.name || "Admin",
          createdAt: new Date(tip.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }),
      );

      setTips(transformed);
    } catch (err) {
      console.error("Error fetching tips:", err);
      toast.error("Failed to load tips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleTogglePublish = async (tip: TipRow) => {
    const originalStatus = tip.isPublished;

    // Optimistic update
    setTips(prev =>
      prev.map(t =>
        t.id === tip.id ? { ...t, isPublished: !originalStatus } : t,
      ),
    );

    try {
      const res = await fetch(`/api/admin/tips/${tip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !originalStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update tip");
      }

      toast.success(!originalStatus ? "Tip published" : "Tip unpublished");
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle publish status");
      // Rollback on error
      setTips(prev =>
        prev.map(t =>
          t.id === tip.id ? { ...t, isPublished: originalStatus } : t,
        ),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTip) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/tips/${deleteTip.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete tip");
      }
      toast.success("Tip deleted successfully");
      setDeleteTip(null);
      fetchTips();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete tip");
    } finally {
      setDeleting(false);
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
        <SiteHeader title="Tips" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Header with Create button */}
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Manage Tips</h2>
                  <p className="text-sm text-muted-foreground">
                    Create and manage tips for job seekers.
                  </p>
                </div>

                {loading ? (
                  <div className="flex h-60 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <TipsTable
                    data={tips}
                    onDelete={setDeleteTip}
                    onTogglePublish={handleTogglePublish}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTip} onOpenChange={() => setDeleteTip(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center sm:text-center">
              Delete Tip
            </DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                &ldquo;{deleteTip?.title}&rdquo;
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="sm:flex-1 font-medium"
              onClick={() => setDeleteTip(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="sm:flex-1 font-semibold"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete Tip
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
