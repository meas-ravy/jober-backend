"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { Switch } from "@/src/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { TipRow } from "./tips-table";

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

type TipDialogProps = {
  tip: TipRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    title: string;
    content: string;
    imageUrl: string;
    category: string;
    isPublished: boolean;
  }) => Promise<void>;
};

export function TipDialog({ tip, open, onOpenChange, onSave }: TipDialogProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [category, setCategory] = React.useState("Career");
  const [isPublished, setIsPublished] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (tip) {
      setTitle(tip.title);
      setContent(tip.content);
      setImageUrl(tip.imageUrl || "");
      setCategory(tip.category);
      setIsPublished(tip.isPublished);
    } else {
      setTitle("");
      setContent("");
      setImageUrl("");
      setCategory("Career");
      setIsPublished(false);
    }
  }, [tip, open]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSave({ title, content, imageUrl, category, isPublished });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!tip;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tip" : "Create New Tip"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the tip details below."
              : "Fill in the details to create a new tip for job seekers."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tip-title">Title</Label>
            <Input
              id="tip-title"
              placeholder="Enter tip title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-content">Content</Label>
            <Textarea
              id="tip-content"
              placeholder="Write the tip content..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-image">Image URL (optional)</Label>
            <Input
              id="tip-image"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
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
            <div className="space-y-2">
              <Label>Published</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <span className="text-sm text-muted-foreground">
                  {isPublished ? "Visible to job seekers" : "Draft"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Tip"
            ) : (
              "Create Tip"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
