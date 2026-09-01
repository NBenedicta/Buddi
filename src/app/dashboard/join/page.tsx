"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export default function JoinGroupPage() {
  const router = useRouter();
  const { user } = useUser();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", code.trim().toLowerCase())
      .maybeSingle();

    if (groupError || !group) {
      setError("Invalid invite code. Double-check and try again.");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error: joinError } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, role: "member" });

      if (joinError) {
        setError(joinError.message);
        setLoading(false);
        return;
      }

      await supabase.from("notifications").insert({
        user_id: group.owner_id,
        type: "new_member",
        message: `Someone joined ${group.name}.`,
        link: `/dashboard/groups/${group.id}`,
      });
    }

    router.push(`/dashboard/groups/${group.id}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-10 text-center">
      <span className="text-5xl">🔗</span>
      <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-gray-50">Join a group</h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">
        Enter the invite code your friend shared with you.
      </p>

      <Card className="mt-8 w-full p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="code">Invite code</Label>
            <input
              id="code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="a1b2c3d4"
              className="h-14 w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white text-center font-mono text-xl tracking-[0.3em] text-purple-700 dark:text-purple-300 placeholder:tracking-normal placeholder:text-gray-300 dark:text-gray-600 focus:border-purple-400 dark:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100 dark:ring-purple-500/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" disabled={loading || !code} className="w-full">
            {loading ? "Joining…" : "Join Group"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
