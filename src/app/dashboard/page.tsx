"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, Avatar } from "@/components/ui/card";
import { PostComposer } from "@/components/group/PostComposer";
import { cn, formatRelativeTime, postTypeMeta } from "@/lib/utils";
import type { Group, Post, Profile } from "@/types/database";

type PostWithAuthor = Post & { author: Profile | null };

const QUICK_ACTIONS = [
  { href: "/dashboard/goals", emoji: "🎯", label: "My Goals", subtitle: "Track progress", bg: "bg-purple-50 dark:bg-purple-500/10" },
  { href: "/dashboard/reflect", emoji: "🪞", label: "Weekly Reflect", subtitle: "Look back & plan", bg: "bg-violet-50 dark:bg-violet-500/10" },
  { href: "/dashboard/groups/create", emoji: "✨", label: "New Group", subtitle: "Start a circle", bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10" },
  { href: "/dashboard/join", emoji: "🔗", label: "Join Group", subtitle: "Use an invite code", bg: "bg-pink-50 dark:bg-pink-500/10" },
];

export default function DashboardPage() {
  const { user, profile } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGoalsCount, setActiveGoalsCount] = useState(0);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts(myGroups: Group[], supabase = createClient()) {
    const groupIds = myGroups.map((g) => g.id);
    if (groupIds.length === 0) {
      setPosts([]);
      return;
    }
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*, author:profiles(*)")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false })
      .limit(10);
    setPosts((recentPosts as unknown as PostWithAuthor[]) ?? []);
  }

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, groups(*)")
        .eq("user_id", user!.id);

      const myGroups = (memberships ?? [])
        .map((m) => m.groups as unknown as Group)
        .filter(Boolean);
      setGroups(myGroups);

      const { count: goalsCount } = await supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "active");
      setActiveGoalsCount(goalsCount ?? 0);

      await loadPosts(myGroups, supabase);
      setLoading(false);
    }

    load();
  }, [user]);

  return (
    <div className="space-y-10">
      {/* Hero greeting */}
      <div className="gradient-primary relative overflow-hidden rounded-3xl px-6 py-10 text-white shadow-xl shadow-purple-200 sm:px-10">
        <div className="blob -right-20 -top-20 h-64 w-64 bg-white/15" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Hey, {profile?.username ?? "there"} 👋
          </h1>
          <p className="mt-2 max-w-xl text-purple-100">
            Here&apos;s what&apos;s happening across your circles today.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-lg">
            {[
              { label: "Groups", value: groups.length },
              { label: "Active Goals", value: activeGoalsCount },
              { label: "Recent Posts", value: posts.length },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-purple-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start a post */}
      {!loading && (
        <PostComposer
          groups={groups}
          collapsible
          onPosted={() => loadPosts(groups)}
        />
      )}

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Quick actions</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className={cn("h-full p-5", a.bg)}>
                <span className="text-3xl">{a.emoji}</span>
                <p className="mt-3 font-semibold text-gray-900 dark:text-gray-50">{a.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a.subtitle}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Groups */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Your Groups</h2>
            <Link href="/dashboard/groups" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {groups.slice(0, 3).map((g) => (
              <Link key={g.id} href={`/dashboard/groups/${g.id}`}>
                <Card className="flex items-center gap-4 p-5">
                  <Avatar name={g.name} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-gray-50">{g.name}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {g.description || "No description"}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
            {!loading && groups.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-3xl">👥</p>
                <p className="mt-2 font-medium text-gray-700 dark:text-gray-200">No groups yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create or join one to get started.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Recent Activity</h2>
          <Card className="divide-y divide-purple-50 dark:divide-purple-900/30 p-0">
            {posts.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
                {loading ? "Loading…" : "No activity yet. Post something in a group!"}
              </p>
            ) : (
              posts.map((post) => {
                const meta = postTypeMeta(post.type);
                return (
                  <div key={post.id} className="flex gap-3 p-5">
                    <Avatar name={post.author?.username} src={post.author?.avatar_url} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-50">
                          {post.author?.username ?? "Someone"}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {meta.emoji} {meta.label}
                        </span>
                        <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatRelativeTime(post.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{post.content}</p>
                      {post.media_url && post.media_type === "image" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.media_url}
                          alt="attachment"
                          className="mt-2 h-32 w-full max-w-xs rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
