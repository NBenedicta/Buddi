"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Card, Avatar, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import type { FocusParticipant, FocusSession, Group, Profile } from "@/types/database";

const DURATIONS = [
  { label: "25 min (Pomodoro)", value: 25 },
  { label: "50 min (Deep work)", value: 50 },
  { label: "Custom", value: 0 },
];

type ParticipantWithProfile = FocusParticipant & { profile: Profile | null };

export default function FocusPage() {
  const { user } = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeSessions, setActiveSessions] = useState<FocusSession[]>([]);
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [myGoal, setMyGoal] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState(25);
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("group_members")
      .select("groups(*)")
      .eq("user_id", user.id)
      .then(({ data }) => setGroups((data ?? []).map((m) => m.groups as unknown as Group).filter(Boolean)));
    refreshSessions(supabase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function refreshSessions(supabase = createClient()) {
    if (!user) return;
    const groupIds = groups.map((g) => g.id);
    const { data: active } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("status", "active")
      .or(
        [`creator_id.eq.${user.id}`, groupIds.length ? `group_id.in.(${groupIds.join(",")})` : ""]
          .filter(Boolean)
          .join(",")
      )
      .order("started_at", { ascending: false });
    setActiveSessions(active ?? []);

    const { data: past } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("creator_id", user.id)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(10);
    setHistory(past ?? []);
  }

  // reload once groups are known so the OR filter includes them
  useEffect(() => {
    if (groups.length >= 0 && user) refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  useEffect(() => {
    if (!currentSession) return;
    const supabase = createClient();

    function loadParticipants() {
      supabase
        .from("focus_participants")
        .select("*, profile:profiles(*)")
        .eq("session_id", currentSession!.id)
        .then(({ data }) => setParticipants((data as unknown as ParticipantWithProfile[]) ?? []));
    }
    loadParticipants();

    const channel = supabase
      .channel(`focus-${currentSession.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_participants", filter: `session_id=eq.${currentSession.id}` },
        loadParticipants
      )
      .subscribe();

    const endsAt = new Date(currentSession.started_at).getTime() + currentSession.duration_minutes * 60000;
    const tick = () => setRemaining(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [currentSession]);

  useEffect(() => {
    if (currentSession && remaining === 0 && !showSummary) {
      completeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const timeLabel = useMemo(() => {
    const m = Math.floor(remaining / 60)
      .toString()
      .padStart(2, "0");
    const s = (remaining % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  async function createSession(e: FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    const supabase = createClient();
    const finalDuration = duration === 0 ? customDuration : duration;
    const { data } = await supabase
      .from("focus_sessions")
      .insert({
        creator_id: user.id,
        group_id: groupId || null,
        title: title.trim(),
        duration_minutes: finalDuration,
      })
      .select()
      .single();
    if (data) {
      await supabase.from("focus_participants").insert({ session_id: data.id, user_id: user.id, goal: myGoal || null });
      setCurrentSession(data);
      setShowCreate(false);
      setTitle("");
    }
  }

  async function joinSession(session: FocusSession) {
    if (!user) return;
    const supabase = createClient();
    await supabase
      .from("focus_participants")
      .upsert({ session_id: session.id, user_id: user.id, goal: myGoal || null }, { onConflict: "session_id,user_id" });
    setCurrentSession(session);
  }

  async function completeSession() {
    if (!currentSession) return;
    const supabase = createClient();
    await supabase
      .from("focus_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", currentSession.id);
    setShowSummary(true);
    await refreshSessions(supabase);
  }

  function leaveSummary() {
    setShowSummary(false);
    setCurrentSession(null);
    setMyGoal("");
  }

  if (currentSession && !showSummary) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <Card className="p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-500 dark:text-purple-400">
            Focus Session
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-50">{currentSession.title}</h1>
          <p className="gradient-text mt-8 text-7xl font-black tabular-nums">{timeLabel}</p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {currentSession.duration_minutes} minute session
          </p>

          <div className="mt-8 space-y-2 text-left">
            <Label htmlFor="goal">Your goal for this session</Label>
            <Input
              id="goal"
              placeholder="e.g. Finish chapter 3"
              value={myGoal}
              onBlur={async () => {
                if (!user) return;
                const supabase = createClient();
                await supabase
                  .from("focus_participants")
                  .update({ goal: myGoal })
                  .eq("session_id", currentSession.id)
                  .eq("user_id", user.id);
              }}
              onChange={(e) => setMyGoal(e.target.value)}
            />
          </div>

          <div className="mt-8">
            <p className="mb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
              Participants ({participants.length})
            </p>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 p-3 text-left">
                  <Avatar name={p.profile?.username} src={p.profile?.avatar_url} size={32} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{p.profile?.username}</p>
                    {p.goal && <p className="text-xs text-gray-500 dark:text-gray-400">{p.goal}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" className="mt-8 w-full" onClick={completeSession}>
            End session early
          </Button>
        </Card>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <Card className="animate-pop-in p-10">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-gray-50">Session complete!</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            You focused for {currentSession?.duration_minutes} minutes on{" "}
            <strong>{currentSession?.title}</strong>.
          </p>
          <Button className="mt-8" onClick={leaveSummary}>
            Back to Focus
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Focus Sessions</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Co-work with your group in real time.</p>
        </div>
        <Button onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? "Cancel" : "+ New Session"}
        </Button>
      </div>

      {showCreate && (
        <Card className="animate-pop-in p-6">
          <form onSubmit={createSession} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="s-title">Session title</Label>
              <Input
                id="s-title"
                required
                placeholder="e.g. Deep work block"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {DURATIONS.map((d) => (
                    <option key={d.label} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </div>
              {duration === 0 && (
                <div className="space-y-1.5">
                  <Label>Custom minutes</Label>
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                  />
                </div>
              )}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Group (optional)</Label>
                <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  <option value="">Just me</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Your goal (optional)</Label>
                <Input
                  placeholder="What will you focus on?"
                  value={myGoal}
                  onChange={(e) => setMyGoal(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={!title.trim()}>
              Start Session
            </Button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Active Sessions</h2>
        {activeSessions.length === 0 ? (
          <Card className="p-10 text-center text-gray-500 dark:text-gray-400">
            No active sessions. Start one to co-work with your group!
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeSessions.map((s) => (
              <Card key={s.id} className="p-5">
                <p className="font-bold text-gray-900 dark:text-gray-50">{s.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.duration_minutes} minutes</p>
                <Button size="sm" className="mt-4 w-full" onClick={() => joinSession(s)}>
                  Join Session
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-50">Session History</h2>
          <div className="space-y-3">
            {history.map((s) => (
              <Card key={s.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{s.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeTime(s.started_at)}</p>
                </div>
                <Badge variant="success">{s.duration_minutes} min</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
