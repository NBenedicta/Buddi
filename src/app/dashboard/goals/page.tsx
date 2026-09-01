"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Progress } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { cn, PRIORITIES, priorityMeta } from "@/lib/utils";
import type { Goal, Group, Streak } from "@/types/database";

export default function GoalsPage() {
  const { user } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [groupId, setGroupId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadGoals(supabase = createClient()) {
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals(data ?? []);
  }

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      await loadGoals(supabase);
      const { data: memberships } = await supabase
        .from("group_members")
        .select("groups(*)")
        .eq("user_id", user!.id);
      setGroups((memberships ?? []).map((m) => m.groups as unknown as Group).filter(Boolean));
      const { data: streakData } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      setStreak(streakData);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("goals").insert({
      user_id: user.id,
      title: title.trim(),
      description: description || null,
      priority,
      deadline: deadline || null,
      group_id: groupId || null,
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDeadline("");
    setGroupId("");
    setSubmitting(false);
    setShowForm(false);
    await loadGoals(supabase);
  }

  async function updateProgress(goal: Goal, progress: number) {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, progress } : g)));
    const supabase = createClient();
    await supabase.from("goals").update({ progress }).eq("id", goal.id);
    await touchStreak();
  }

  async function completeGoal(goal: Goal) {
    const supabase = createClient();
    await supabase
      .from("goals")
      .update({ status: "completed", progress: 100, completed_at: new Date().toISOString() })
      .eq("id", goal.id);
    await touchStreak();
    await loadGoals(supabase);
  }

  async function deleteGoal(goal: Goal) {
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    const supabase = createClient();
    await supabase.from("goals").delete().eq("id", goal.id);
  }

  async function touchStreak() {
    if (!user) return;
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!streak) {
      const { data } = await supabase
        .from("streaks")
        .insert({ user_id: user.id, current_streak: 1, longest_streak: 1, last_activity_date: today })
        .select()
        .single();
      setStreak(data);
      return;
    }
    if (streak.last_activity_date === today) return;

    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);
    const nextStreak = streak.last_activity_date === yesterday ? streak.current_streak + 1 : 1;

    const { data } = await supabase
      .from("streaks")
      .update({
        current_streak: nextStreak,
        longest_streak: Math.max(nextStreak, streak.longest_streak),
        last_activity_date: today,
      })
      .eq("user_id", user.id)
      .select()
      .single();
    setStreak(data);
  }

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Your Goals</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-400">
            <span>
              {active.length} active · {completed.length} completed
            </span>
            {streak && streak.current_streak > 0 && (
              <Badge variant="warning">🔥 {streak.current_streak} day streak</Badge>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Goal"}
        </Button>
      </div>

      {showForm && (
        <Card className="animate-pop-in p-6">
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Run a 10k"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.emoji} {p.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Share with a group (optional)</Label>
                <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">Keep private</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? "Creating…" : "Create Goal"}
            </Button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Active Goals</h2>
        {loading ? (
          <p className="text-gray-400 dark:text-gray-500">Loading…</p>
        ) : active.length === 0 ? (
          <Card className="p-10 text-center text-gray-500 dark:text-gray-400">No active goals yet. Create one!</Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {active.map((goal) => {
              const meta = priorityMeta(goal.priority);
              return (
                <Card key={goal.id} className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 dark:text-gray-50">{goal.title}</p>
                    <Badge className={cn("border", meta.color)} variant="outline">
                      {meta.emoji} {meta.label}
                    </Badge>
                  </div>
                  {goal.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{goal.description}</p>
                  )}
                  {goal.deadline && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Due {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={goal.progress}
                      onChange={(e) => updateProgress(goal, Number(e.target.value))}
                      className="mt-2 w-full accent-purple-600"
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="subtle" className="flex-1" onClick={() => completeGoal(goal)}>
                      ✓ Done
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteGoal(goal)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Completed Goals</h2>
          <div className="space-y-3">
            {completed.map((goal) => (
              <Card key={goal.id} className="flex items-center justify-between p-5 opacity-70">
                <div>
                  <p className="font-medium text-gray-500 dark:text-gray-400 line-through">{goal.title}</p>
                  {goal.completed_at && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Completed {new Date(goal.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteGoal(goal)}>
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
