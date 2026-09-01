"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { Card, Avatar, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { cn, formatRelativeTime, postTypeMeta, REACTION_EMOJIS } from "@/lib/utils";
import type { Comment, Post, Profile, Reaction } from "@/types/database";

type PostWithAuthor = Post & { author: Profile | null };
type CommentWithAuthor = Comment & { author: Profile | null };

const HELP_STATUS_LABEL: Record<string, { label: string; variant: "warning" | "default" | "success" }> = {
  open: { label: "Open", variant: "warning" },
  offered: { label: "Someone offered", variant: "default" },
  resolved: { label: "Resolved", variant: "success" },
};

export function PostCard({
  post,
  onDeleted,
}: {
  post: PostWithAuthor;
  onDeleted: (id: string) => void;
}) {
  const { user } = useUser();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [helpStatus, setHelpStatus] = useState(post.help_status);
  const meta = postTypeMeta(post.type);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reactions")
      .select("*")
      .eq("post_id", post.id)
      .then(({ data }) => setReactions(data ?? []));
  }, [post.id]);

  useEffect(() => {
    if (!showComments) return;
    const supabase = createClient();
    supabase
      .from("comments")
      .select("*, author:profiles(*)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments((data as CommentWithAuthor[]) ?? []));
  }, [showComments, post.id]);

  async function toggleReaction(emoji: string) {
    if (!user) return;
    const supabase = createClient();
    const mine = reactions.find((r) => r.user_id === user.id && r.emoji === emoji);

    if (mine) {
      setReactions((prev) => prev.filter((r) => r.id !== mine.id));
      await supabase.from("reactions").delete().eq("id", mine.id);
    } else {
      const optimistic: Reaction = {
        id: `temp-${crypto.randomUUID()}`,
        post_id: post.id,
        user_id: user.id,
        emoji,
        created_at: new Date().toISOString(),
      };
      setReactions((prev) => [...prev, optimistic]);
      const { data } = await supabase
        .from("reactions")
        .insert({ post_id: post.id, user_id: user.id, emoji })
        .select()
        .single();
      if (data) {
        setReactions((prev) => prev.map((r) => (r.id === optimistic.id ? data : r)));
        if (post.author_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            type: "reaction",
            message: `Someone reacted ${emoji} to your post.`,
            link: `/dashboard/groups/${post.group_id}`,
          });
        }
      }
    }
  }

  async function submitComment() {
    if (!user || !commentDraft.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: user.id, content: commentDraft.trim() })
      .select("*, author:profiles(*)")
      .single();
    if (data) {
      setComments((prev) => [...prev, data as unknown as CommentWithAuthor]);
      setCommentDraft("");
      if (post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "comment",
          message: "Someone commented on your post.",
          link: `/dashboard/groups/${post.group_id}`,
        });
      }
    }
  }

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", post.id);
    onDeleted(post.id);
  }

  async function offerHelp() {
    if (!user) return;
    const supabase = createClient();
    setHelpStatus("offered");
    await supabase.from("posts").update({ help_status: "offered" }).eq("id", post.id);
    await supabase.from("notifications").insert({
      user_id: post.author_id,
      type: "help_accepted",
      message: "Someone offered to help with your request.",
      link: `/dashboard/groups/${post.group_id}`,
    });
  }

  const reactionCounts = REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: reactions.filter((r) => r.emoji === emoji).length,
    mine: reactions.some((r) => r.user_id === user?.id && r.emoji === emoji),
  })).filter((r) => r.count > 0 || true);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.author?.username} src={post.author?.avatar_url} size={42} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-50">{post.author?.username ?? "Someone"}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span>{meta.emoji} {meta.label}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.type === "help_request" && helpStatus && (
            <Badge variant={HELP_STATUS_LABEL[helpStatus].variant}>
              {HELP_STATUS_LABEL[helpStatus].label}
            </Badge>
          )}
          {user?.id === post.author_id && (
            <button
              onClick={handleDelete}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 dark:text-gray-600 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
              aria-label="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-gray-800 dark:text-gray-100">{post.content}</p>

      {post.media_url && (
        <div className="mt-3">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls className="max-h-96 w-full rounded-xl object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt="attachment"
              className="max-h-96 w-full rounded-xl object-cover"
            />
          )}
        </div>
      )}

      {post.type === "help_request" && helpStatus === "open" && user?.id !== post.author_id && (
        <Button size="sm" variant="subtle" className="mt-4" onClick={offerHelp}>
          🙋 I can help!
        </Button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-purple-50 dark:border-purple-900/30 pt-4">
        {reactionCounts.map(({ emoji, count, mine }) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-sm transition-colors cursor-pointer",
              mine
                ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700"
            )}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{count}</span>}
          </button>
        ))}
        <button
          onClick={() => setShowComments((s) => !s)}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-white/5 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
        >
          <MessageCircle size={16} />
          {comments.length > 0 ? comments.length : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 border-t border-purple-50 dark:border-purple-900/30 pt-4">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author?.username} src={c.author?.avatar_url} size={30} />
              <div className="rounded-2xl bg-purple-50 dark:bg-purple-500/10 px-3.5 py-2 text-sm">
                <span className="mr-1.5 font-semibold text-gray-900 dark:text-gray-50">{c.author?.username}</span>
                <span className="text-gray-700 dark:text-gray-200">{c.content}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Add a comment…"
              className="h-10 flex-1 rounded-full border-2 border-gray-200 dark:border-gray-700 px-4 text-sm focus:border-purple-400 dark:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 dark:ring-purple-500/20"
            />
            <Button size="sm" onClick={submitComment} disabled={!commentDraft.trim()}>
              Send
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
