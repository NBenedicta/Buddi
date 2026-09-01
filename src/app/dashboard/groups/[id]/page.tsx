"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, Badge } from "@/components/ui/card";
import { PostComposer } from "@/components/group/PostComposer";
import { PostCard } from "@/components/group/PostCard";
import type { Group, Post, Profile } from "@/types/database";

type PostWithAuthor = Post & { author: Profile | null };

export default function GroupFeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = usePromise(params);
  const { user } = useUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function loadPosts(supabase = createClient()) {
    const { data } = await supabase
      .from("posts")
      .select("*, author:profiles(*)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    setPosts((data as unknown as PostWithAuthor[]) ?? []);
  }

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      const { data: groupData, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .maybeSingle();

      if (error || !groupData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setGroup(groupData);
      await loadPosts(supabase);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`posts-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `group_id=eq.${groupId}` },
        () => loadPosts(supabase)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groupId]);

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <p className="text-2xl">🚫</p>
        <p className="mt-2 font-semibold text-gray-900 dark:text-gray-50">Group not found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          It may have been deleted, or you may not have access.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/groups"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          <ArrowLeft size={16} /> Back to groups
        </Link>
        {group && (
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">{group.name}</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">{group.description || "No description yet."}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">Invite code</p>
                <Badge className="mt-1 font-mono">{group.invite_code}</Badge>
              </div>
            </div>
          </Card>
        )}
      </div>

      {group && <PostComposer groupId={group.id} onPosted={() => loadPosts()} />}

      <div className="space-y-5">
        {loading ? (
          <p className="text-center text-gray-400 dark:text-gray-500">Loading…</p>
        ) : posts.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">📭</span>
            <p className="font-semibold text-gray-900 dark:text-gray-50">No posts yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to share an update!</p>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
