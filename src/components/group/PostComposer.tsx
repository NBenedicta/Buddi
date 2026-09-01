"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Card, Avatar } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn, POST_TYPES, type PostType } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import type { Group } from "@/types/database";

const PLACEHOLDERS: Record<PostType, string> = {
  update: "Share what you've been up to…",
  achievement: "What did you just accomplish? 🏆",
  help_request: "What do you need help with?",
  reflection: "What's on your mind this week?",
  milestone: "What milestone did you hit? 🎯",
};

export function PostComposer({
  groupId,
  groups,
  collapsible,
  onPosted,
}: {
  /** Fixed group to post into (used on a group's own feed page). */
  groupId?: string;
  /** When no fixed groupId is given, lets the user pick which group to post to. */
  groups?: Group[];
  /** Start collapsed as a LinkedIn-style "Start a post…" bar (used on the dashboard). */
  collapsible?: boolean;
  onPosted: (postedGroupId: string) => void;
}) {
  const { user, profile } = useUser();
  const [expanded, setExpanded] = useState(!collapsible);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [type, setType] = useState<PostType>("update");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Falls back to the first available group until the user picks one
  // explicitly, without needing an effect to sync derived state. `||` (not
  // `??`) is intentional: an empty-string selection should also fall through.
  const activeGroupId = groupId || selectedGroupId || groups?.[0]?.id || "";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function clearFile() {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function reset() {
    setContent("");
    clearFile();
    setType("update");
    if (collapsible) setExpanded(false);
  }

  async function handleSubmit() {
    if (!user || !content.trim() || !activeGroupId) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let media_url: string | null = null;
    let media_type: "image" | "video" | null = null;

    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data } = supabase.storage.from("post-media").getPublicUrl(path);
      media_url = data.publicUrl;
      media_type = file.type.startsWith("video") ? "video" : "image";
    }

    const { error: postError } = await supabase.from("posts").insert({
      author_id: user.id,
      group_id: activeGroupId,
      type,
      content: content.trim(),
      media_url,
      media_type,
      help_status: type === "help_request" ? "open" : null,
    });

    setSubmitting(false);

    if (postError) {
      setError(postError.message);
      return;
    }

    reset();
    onPosted(activeGroupId);
  }

  if (collapsible && !expanded) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={profile?.username} src={profile?.avatar_url} size={40} />
        <button
          onClick={() => setExpanded(true)}
          disabled={!groups || groups.length === 0}
          className="flex-1 rounded-full border-2 border-gray-200 dark:border-gray-700 px-4 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500 transition-colors hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {groups && groups.length > 0
            ? "Start a post… catch your group up on what you're doing"
            : "Join or create a group to start posting"}
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      {!groupId && (
        <div className="mb-4">
          <Select
            value={activeGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="font-medium"
          >
            {(groups ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                Post to {g.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {POST_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              type === t.value
                ? "border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-purple-200 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400"
            )}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <Textarea
        rows={3}
        autoFocus={collapsible}
        placeholder={PLACEHOLDERS[type]}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {previewUrl && (
        <div className="relative mt-3 inline-block">
          {file?.type.startsWith("video") ? (
            <video src={previewUrl} controls className="max-h-64 rounded-xl" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="max-h-64 rounded-xl object-cover" />
          )}
          <button
            onClick={clearFile}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white shadow-md cursor-pointer"
            aria-label="Remove media"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-4 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={18} />
            Media
          </Button>
          {collapsible && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting || !activeGroupId}
          size="md"
        >
          {submitting ? "Posting…" : "Post"}
        </Button>
      </div>
    </Card>
  );
}
