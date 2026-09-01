"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Group, Reflection } from "@/types/database";

function getWeekLabel(date = new Date()) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

const QUESTIONS = [
  { key: "wins", emoji: "🏆", label: "What did you accomplish this week?" },
  { key: "struggles", emoji: "😤", label: "What challenged you?" },
  { key: "next_goals", emoji: "🎯", label: "What are your goals for next week?" },
  { key: "help_needed", emoji: "🙋", label: "What help do you need?" },
] as const;

export default function ReflectPage() {
  const { user } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState("");
  const [answers, setAnswers] = useState({ wins: "", struggles: "", next_goals: "", help_needed: "" });
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [past, setPast] = useState<Reflection[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function loadPast(supabase = createClient()) {
    if (!user) return;
    const { data } = await supabase
      .from("reflections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setPast(data ?? []);
  }

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("group_members")
        .select("groups(*)")
        .eq("user_id", user!.id);
      setGroups((data ?? []).map((m) => m.groups as unknown as Group).filter(Boolean));
      await loadPast(supabase);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("reflections").insert({
      user_id: user.id,
      group_id: groupId || null,
      week: getWeekLabel(),
      ...answers,
    });
    setSubmitting(false);
    setCelebrate(true);
    setAnswers({ wins: "", struggles: "", next_goals: "", help_needed: "" });
    setGroupId("");
    await loadPast(supabase);
    setTimeout(() => setCelebrate(false), 3500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Weekly Reflection</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Week of {getWeekLabel()}</p>
      </div>

      {celebrate && (
        <Card className="animate-pop-in border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-500/10 p-6 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 font-semibold text-green-700 dark:text-green-400">Reflection submitted, nice work!</p>
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
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

          {QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-1.5">
              <Label>
                {q.emoji} {q.label}
              </Label>
              <Textarea
                rows={3}
                value={answers[q.key]}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
              />
            </div>
          ))}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting…" : "Submit Reflection"}
          </Button>
        </form>
      </Card>

      {past.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Past Reflections</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <Card key={r.id} className="p-0">
                <button
                  onClick={() => setExpanded((e) => (e === r.id ? null : r.id))}
                  className="flex w-full items-center justify-between p-5 text-left cursor-pointer"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-50">Week of {r.week}</span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-gray-400 dark:text-gray-500 transition-transform",
                      expanded === r.id && "rotate-180"
                    )}
                  />
                </button>
                {expanded === r.id && (
                  <div className="space-y-4 border-t border-purple-50 dark:border-purple-900/30 p-5 pt-4">
                    {QUESTIONS.map((q) => (
                      <div key={q.key}>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                          {q.emoji} {q.label}
                        </p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                          {r[q.key] || <span className="text-gray-300 dark:text-gray-600">Not answered</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
