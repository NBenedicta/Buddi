"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
      .insert({ name, description: description || null, owner_id: user.id })
      .select()
      .single();

    if (groupError || !group) {
      setError(groupError?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id, role: "owner" });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/groups");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Create a group</h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">
        Start a private circle and invite the people you want to grow with.
      </p>

      <Card className="mt-8 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Group name</Label>
            <Input
              id="name"
              required
              placeholder="e.g. Morning Runners"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name} className="flex-1">
              {loading ? "Creating…" : "Create group"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
