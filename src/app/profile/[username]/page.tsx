"use client";

import { useEffect, useState, use as usePromise } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, Avatar, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { formatRelativeTime, postTypeMeta } from "@/lib/utils";
import type { Post, Profile } from "@/types/database";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = usePromise(params);
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState({ groups: 0, goalsCompleted: 0, posts: 0, streak: 0 });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentUser?.id === profile?.id;

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: p, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error || !p) {
        setNotFound(true);
        return;
      }
      setProfile(p);
      setBio(p.bio ?? "");

      const [{ count: groupsCount }, { count: goalsCount }, { count: postsCount }, { data: streak }, { data: posts }] =
        await Promise.all([
          supabase.from("group_members").select("id", { count: "exact", head: true }).eq("user_id", p.id),
          supabase
            .from("goals")
            .select("id", { count: "exact", head: true })
            .eq("user_id", p.id)
            .eq("status", "completed"),
          supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", p.id),
          supabase.from("streaks").select("current_streak").eq("user_id", p.id).maybeSingle(),
          supabase
            .from("posts")
            .select("*")
            .eq("author_id", p.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

      setStats({
        groups: groupsCount ?? 0,
        goalsCompleted: goalsCount ?? 0,
        posts: postsCount ?? 0,
        streak: streak?.current_streak ?? 0,
      });
      setRecentPosts(posts ?? []);
    }

    load();
  }, [username]);

  async function handleSave() {
    if (!profile || !currentUser) return;
    setSaving(true);
    const supabase = createClient();
    let avatar_url = profile.avatar_url;

    if (avatarFile) {
      const path = `${currentUser.id}/${Date.now()}-${avatarFile.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!error) {
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
    }

    const { data } = await supabase
      .from("profiles")
      .update({ bio, avatar_url })
      .eq("id", currentUser.id)
      .select()
      .single();

    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-app-glow">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-2xl">🚫</p>
          <p className="mt-2 font-semibold text-gray-900 dark:text-gray-50">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-glow">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <Avatar name={profile?.username} src={profile?.avatar_url} size={88} />
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">{profile?.username}</h1>
              {profile?.created_at && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </p>
              )}
              {!editing && <p className="mt-2 text-gray-600 dark:text-gray-300">{profile?.bio || "No bio yet."}</p>}
            </div>
            {isOwnProfile && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            )}
          </div>

          {editing && (
            <div className="mt-6 space-y-4 border-t border-purple-50 dark:border-purple-900/30 pt-6 text-left">
              <div className="space-y-1.5">
                <Label>Avatar</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="block text-sm text-gray-500 dark:text-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Groups", value: stats.groups },
              { label: "Goals Done", value: stats.goalsCompleted },
              { label: "Posts", value: stats.posts },
              { label: "Streak", value: `${stats.streak}🔥` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-purple-50 dark:bg-purple-500/10 p-4 text-center">
                <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Recent Activity</h2>
          <Card className="divide-y divide-purple-50 dark:divide-purple-900/30 p-0">
            {recentPosts.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">No posts yet.</p>
            ) : (
              recentPosts.map((post) => {
                const meta = postTypeMeta(post.type);
                return (
                  <div key={post.id} className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <Badge>{meta.emoji} {meta.label}</Badge>
                      <span>{formatRelativeTime(post.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{post.content}</p>
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
