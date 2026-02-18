"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const TIP_CATEGORIES = [
  "Career",
  "Interview",
  "Resume",
  "Networking",
  "WorkLife",
  "Skills",
  "JobSearch",
  "Other",
];

type TipFormProps = {
  initialData?: {
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
    category: string;
    isPublished: boolean;
  };
};

export function TipForm({ initialData }: TipFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [content, setContent] = React.useState(initialData?.content || "");
  const [imageUrl, setImageUrl] = React.useState(initialData?.imageUrl || "");
  const [category, setCategory] = React.useState(
    initialData?.category || "Career",
  );
  const [isPublished, setIsPublished] = React.useState(
    initialData?.isPublished || false,
  );
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    try {
      // 1. Get upload signature
      const sigRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageType: "tip-image" }),
      });

      const sigData = await sigRes.json();
      if (!sigRes.ok)
        throw new Error(sigData.error || "Failed to get signature");

      const {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
        transformation,
      } = sigData.data;

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("folder", folder);
      formData.append("transformation", transformation);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok)
        throw new Error(uploadData.error?.message || "Upload failed");

      setImageUrl(uploadData.secure_url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const url = initialData
        ? `/api/admin/tips/${initialData.id}`
        : "/api/admin/tips";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          imageUrl,
          category,
          isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save tip");

      toast.success(
        initialData ? "Tip updated successfully" : "Tip created successfully",
      );
      router.push("/admin/tips");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="h-10 w-10 border-white/10 bg-zinc-900 hover:bg-zinc-800"
        >
          <Link href="/admin/tips">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Tip" : "Create Tip"}
        </h1>
      </div>

      <Card className="border-white/5 bg-black/40 backdrop-blur">
        <CardHeader>
          <CardTitle>
            {isEditing ? "Update existing tip" : "Create a new tip"}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-10 lg:grid-cols-[280px_1fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* Image */}
            <div className="space-y-3">
              <Label>Cover Image</Label>
              <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-zinc-700" />
                )}
              </div>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-white/10 bg-zinc-800 hover:bg-zinc-700"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Change Image"
                )}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter tip title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIP_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>
                Content Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Write your advice here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-[280px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <Button variant="outline" asChild>
                <Link href="/admin/tips">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
