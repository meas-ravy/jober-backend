"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { TipForm } from "../components/tip-form";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export default function EditTipPage() {
  const { id } = useParams();
  const [tip, setTip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        setLoading(true);
        const resDetail = await fetch(`/api/admin/tips/${id}`);

        const data = await resDetail.json();
        if (!resDetail.ok) throw new Error(data.error || "Failed to fetch tip");
        setTip(data.tip);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTip();
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
        <SiteHeader parent="Tips" parentHref="/admin/tips" />
        <div className="flex flex-1 flex-col">
          {loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Error Loading Tip
                </h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/admin/tips">Go Back to Tips</Link>
              </Button>
            </div>
          ) : (
            <TipForm initialData={tip} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
